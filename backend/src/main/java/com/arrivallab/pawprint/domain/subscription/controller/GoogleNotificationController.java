package com.arrivallab.pawprint.domain.subscription.controller;

import com.arrivallab.pawprint.domain.subscription.dto.PubSubPushBody;
import com.arrivallab.pawprint.domain.subscription.service.GoogleNotificationHandler;
import com.arrivallab.pawprint.domain.subscription.service.verifier.RetryableVerificationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Google Play Real-time Developer Notifications (RTDN) 수신.
 *
 * Pub/Sub push subscription 으로 POST 수신. body 는 PubSubPushBody envelope.
 * URL path 에 secret 박아 인증 — Pub/Sub OIDC token 검증보다 단순하고, 1인 운영에 충분.
 *
 * 등록:
 *  1. GCP Pub/Sub topic 생성, Play Console 에서 RTDN topic 으로 연결
 *  2. Pub/Sub push subscription 생성, push endpoint:
 *     https://api.pawprintapp.link/api/subscriptions/webhooks/google/{GOOGLE_WEBHOOK_SECRET}
 *  3. 환경변수 GOOGLE_WEBHOOK_SECRET 에 동일 값 설정
 *
 * 미설정(빈 값) 시 어떤 secret 으로 들어와도 거부 — 사고로 endpoint 가 열리지 않도록.
 */
@Slf4j
@RestController
@RequestMapping("/api/subscriptions/webhooks/google")
@RequiredArgsConstructor
public class GoogleNotificationController {

    private final GoogleNotificationHandler handler;

    @Value("${google.webhook.secret:}")
    private String webhookSecret;

    @PostMapping("/{secret}")
    public ResponseEntity<Void> receive(@PathVariable String secret, @RequestBody PubSubPushBody body) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Google webhook called but google.webhook.secret not configured — rejecting all");
            return ResponseEntity.status(403).build();
        }
        if (!webhookSecret.equals(secret)) {
            log.warn("Google webhook unauthorized — bad secret");
            return ResponseEntity.status(403).build();
        }
        if (body == null || body.message() == null || body.message().data() == null) {
            log.warn("Google webhook received without message.data");
            return ResponseEntity.badRequest().build();
        }
        try {
            handler.handle(body.message().data());
        } catch (RetryableVerificationException e) {
            // 일시 장애(Google API 5xx/429 등) — 5xx 던져 Pub/Sub 재전송 유도.
            log.warn("Google webhook transient failure, will retry: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            // 영구 실패(검증 거부·디코드 실패 등)는 재시도해도 무의미 → 200 ack 로 무한 재전송 차단.
            // 스택트레이스는 남기지 않음 — 같은 알림이 반복 ack 돼도 로그가 폭증하지 않도록 한 줄만.
            log.error("Google webhook permanent failure, acking: {}", e.toString());
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.ok().build();
    }
}
