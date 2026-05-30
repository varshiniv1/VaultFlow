package com.vaultflow.gateway.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token-bucket rate limiter applied at the gateway.
 *
 * <ul>
 *   <li>General API routes  — 100 requests / minute per client IP</li>
 *   <li>/api/ai/**          — 20 requests / minute per client IP (LLM calls are expensive)</li>
 * </ul>
 *
 * Buckets are stored in memory (ConcurrentHashMap). For a multi-node deployment
 * replace the maps with a Bucket4j + Redis/Hazelcast integration.
 */
@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private static final int GENERAL_LIMIT  = 100;
    private static final int AI_LIMIT       = 20;
    private static final Duration ONE_MINUTE = Duration.ofMinutes(1);

    /** General buckets keyed by client IP. */
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    /** AI-endpoint buckets keyed by client IP. */
    private final Map<String, Bucket> aiBuckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String clientIp = resolveClientIp(request);
        String path     = request.getRequestURI();
        boolean isAiPath = path.startsWith("/api/ai/");

        Bucket bucket = isAiPath
                ? aiBuckets.computeIfAbsent(clientIp,   k -> buildBucket(AI_LIMIT))
                : generalBuckets.computeIfAbsent(clientIp, k -> buildBucket(GENERAL_LIMIT));

        if (bucket.tryConsume(1)) {
            return true;
        }

        int limit = isAiPath ? AI_LIMIT : GENERAL_LIMIT;
        log.warn("Rate limit exceeded for IP={} path={} limit={}/min", clientIp, path, limit);

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write(
                "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit: "
                + limit + " requests/minute exceeded. Please slow down.\"}");
        return false;
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private Bucket buildBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillGreedy(requestsPerMinute, ONE_MINUTE)
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Prefer X-Forwarded-For (set by reverse proxies / load balancers),
     * fall back to the direct remote address.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
