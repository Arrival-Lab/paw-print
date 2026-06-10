package com.arrivallab.pawprint.global.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gemini/Apple/Google 등 비용이 발생하는 외부 API 를 호출하는 엔드포인트용 per-user rate limit.
 * SubscriptionLimits 의 월간 한도와 별개로, 짧은 시간 burst (스크립트 자동 호출 등) 차단 목적.
 * 인증된 호출에만 적용 — userId 가 없으면 통과 (별도 인증 가드가 막음).
 */
@Component
public class UserRateLimitInterceptor implements HandlerInterceptor {

    private static final int MAX_REQUESTS = 30;
    private static final long WINDOW_MS = 60_000;

    private final ConcurrentHashMap<String, long[]> counts = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        String key = resolveKey(request);
        if (key == null) return true;

        long now = System.currentTimeMillis();
        long[] slot = counts.compute(key, (k, v) -> {
            if (v == null || now - v[1] > WINDOW_MS) return new long[]{1, now};
            v[0]++;
            return v;
        });

        if (slot[0] <= MAX_REQUESTS) return true;

        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"success\":false,\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해주세요.\",\"data\":null}");
        return false;
    }

    private String resolveKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return auth.getName();
    }
}
