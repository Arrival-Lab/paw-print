package com.arrivallab.pawprint.global.config;

import com.arrivallab.pawprint.global.security.RateLimitInterceptor;
import com.arrivallab.pawprint.global.security.UserRateLimitInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final RateLimitInterceptor rateLimitInterceptor;
    private final UserRateLimitInterceptor userRateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 비인증 IP 기반 — auth 엔드포인트만
        registry.addInterceptor(rateLimitInterceptor)
                .addPathPatterns("/api/auth/**");
        // Gemini Vision/Audio + AI 증상 체크 — userId 기반 burst 차단 (비용 보호).
        // @Premium AOP 의 월간 한도와 별개. premium 계정도 30req/min 으로 제한.
        registry.addInterceptor(userRateLimitInterceptor)
                .addPathPatterns(
                        "/api/records/ocr",
                        "/api/records/audio",
                        "/api/ai/symptom-check",
                        "/api/ai/symptom-check/**"
                );
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
