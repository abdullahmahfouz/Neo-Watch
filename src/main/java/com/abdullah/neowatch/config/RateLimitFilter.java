package com.abdullah.neowatch.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// Simple in-memory per-IP rate limiter. No external dependency (Bucket4j etc.) — a
// single-instance solo deployment doesn't need a distributed limiter, an in-process map is
// enough. Two tiers: a generous cap on general API reads (cheap, Redis-cached, but still
// real request/response work per hit), and a much stricter cap on the two endpoints that
// call the live NASA API (/ingest, /test-nasa) — /ingest is already gated behind an
// optional key, this is defense in depth against a key-guessing script; /test-nasa has no
// key at all, so this is its only protection against quota exhaustion.
//
// Runs after WebConfig's CorsFilter (Ordered.HIGHEST_PRECEDENCE) so a 429 response
// returned here still carries CORS headers.
//
// Known limitation: the per-IP maps grow unboundedly across distinct IPs with no eviction.
// Fine at solo-project scale; would need a cleanup pass or a real cache (e.g. Caffeine) if
// this ever sees traffic from many thousands of distinct clients.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int API_LIMIT_PER_MINUTE = 120;
    private static final int STRICT_LIMIT_PER_MINUTE = 10;
    private static final long WINDOW_MILLIS = 60_000;
    private static final Set<String> STRICT_PATHS = Set.of("/ingest", "/test-nasa");

    // X-Forwarded-For is attacker-controlled unless a trusted reverse proxy sits in front
    // and strips/overwrites any value a client sent — which we can't assume by default.
    // Trusting it unconditionally would let anyone bypass every limit below by sending a
    // fresh fake value per request. Off by default; flip on only once actually deployed
    // behind a proxy that's known to set this header itself (Cloudflare, Railway, etc).
    @Value("${app.trust-proxy-headers:false}")
    private boolean trustProxyHeaders;

    private final ConcurrentHashMap<String, Window> apiWindows = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Window> strictWindows = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        // CORS preflight — no custom header actually reaches the app here, and letting it
        // through unconditionally keeps a real request's preflight from silently eating
        // into that request's own rate-limit budget.
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        boolean isStrict = STRICT_PATHS.contains(path);
        boolean isApi = path.startsWith("/api/");

        if (!isStrict && !isApi) {
            chain.doFilter(request, response);
            return;
        }

        String clientIp = clientIp(request);
        ConcurrentHashMap<String, Window> windows = isStrict ? strictWindows : apiWindows;
        int limit = isStrict ? STRICT_LIMIT_PER_MINUTE : API_LIMIT_PER_MINUTE;

        Window window = windows.computeIfAbsent(clientIp, key -> new Window());
        if (!window.tryConsume(limit)) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("text/plain");
            response.getWriter().write("Too many requests");
            return;
        }

        chain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        if (trustProxyHeaders) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    // Fixed 60-second window per client, reset once it expires. Simpler than a true sliding
    // window or token bucket and good enough at this scale.
    private static class Window {
        private volatile long windowStart = System.currentTimeMillis();
        private int count = 0;

        synchronized boolean tryConsume(int limit) {
            long now = System.currentTimeMillis();
            if (now - windowStart > WINDOW_MILLIS) {
                windowStart = now;
                count = 0;
            }
            count++;
            return count <= limit;
        }
    }
}
