package com.abdullah.neowatch.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

// Allows the React frontend (served from a different origin in production; proxied
// through Vite in dev, so this mainly matters for a deployed build) to call the backend.
// Purely additive — no existing controller or service behavior changes.
//
// Origins are read from ALLOWED_ORIGINS (comma-separated), defaulting to the local
// Vite dev server so nothing breaks for anyone who hasn't set it. Set this to your
// real deployed frontend origin(s) before exposing the backend publicly.
//
// Registered as an actual CorsFilter (not WebMvcConfigurer#addCorsMappings) at
// Ordered.HIGHEST_PRECEDENCE so it always runs first: addCorsMappings' CORS handling
// only kicks in once DispatcherServlet dispatches to a handler, which means a filter
// that short-circuits earlier (e.g. RateLimitFilter returning 429) would otherwise skip
// CORS headers entirely, and a cross-origin browser would see an opaque network error
// instead of a readable 429.
@Configuration
public class WebConfig {

    @Value("${app.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split("\\s*,\\s*")));
        config.setAllowedMethods(List.of("GET", "OPTIONS"));
        config.setAllowedHeaders(List.of("X-Ingest-Key"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(new CorsFilter(source));
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
