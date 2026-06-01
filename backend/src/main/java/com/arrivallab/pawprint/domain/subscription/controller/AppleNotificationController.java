package com.arrivallab.pawprint.domain.subscription.controller;

import com.arrivallab.pawprint.domain.subscription.service.AppleNotificationHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * App Store Server Notifications V2 webhook 수신.
 *
 * Apple 이 구독 이벤트 발생 시 등록된 URL 로 POST. body 는 { "signedPayload": "<JWS>" }.
 * 인증은 SignedDataVerifier 의 JWS 서명 검증으로 보장 — SecurityConfig 에서 permitAll.
 *
 * 등록: App Store Connect → 앱 → "App Information" → "App Store Server Notifications"
 *   Production Server URL: https://api.pawprintapp.link/api/subscriptions/webhooks/apple
 *   Sandbox Server URL:    동일 URL (한 endpoint 가 양쪽 처리)
 *   Version: Version 2
 */
@Slf4j
@RestController
@RequestMapping("/api/subscriptions/webhooks/apple")
@RequiredArgsConstructor
public class AppleNotificationController {

    private final AppleNotificationHandler handler;

    @PostMapping
    public ResponseEntity<Void> receive(@RequestBody Map<String, String> body) {
        String signedPayload = body.get("signedPayload");
        if (signedPayload == null || signedPayload.isBlank()) {
            log.warn("Apple webhook received without signedPayload");
            return ResponseEntity.badRequest().build();
        }
        try {
            handler.handle(signedPayload);
        } catch (Exception e) {
            // Apple 은 2xx 가 아니면 재시도. 검증 실패는 재시도해도 동일하므로 200 으로 응답 — fraud 보호는 verifier 가 담당.
            // 일시 장애(DB 등)는 5xx 던져 재시도 받기.
            log.error("Apple webhook handling failed: {}", e.toString(), e);
            return ResponseEntity.internalServerError().build();
        }
        return ResponseEntity.ok().build();
    }
}
