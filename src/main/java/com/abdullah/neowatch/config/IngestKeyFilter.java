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

// Gates /ingest behind X-Ingest-Key when app.ingest-key (env INGEST_KEY) is set, since it
// calls the real NASA API using our key and writes to the database — left open by default
// so nothing breaks for anyone who hasn't configured a key yet (local dev).
//
// A filter rather than a check inside IngestController so the pattern (extract into a
// dedicated OncePerRequestFilter, same as RateLimitFilter) is reusable if another endpoint
// ever needs the same kind of gate, instead of copy-pasting the check into each controller.
// Runs after RateLimitFilter, so a flood of wrong-key attempts still gets capped.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class IngestKeyFilter extends OncePerRequestFilter {

    @Value("${app.ingest-key:}")
    private String ingestKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        boolean isIngest = request.getRequestURI().equals("/ingest");
        boolean isPreflight = HttpMethod.OPTIONS.matches(request.getMethod());

        if (isIngest && !isPreflight && !ingestKey.isBlank()) {
            String providedKey = request.getHeader("X-Ingest-Key");
            if (!ingestKey.equals(providedKey)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
