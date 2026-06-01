package com.arrivallab.pawprint.domain.subscription.service;

import com.arrivallab.pawprint.domain.subscription.dto.GoogleDeveloperNotification;
import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;
import com.arrivallab.pawprint.domain.subscription.service.verifier.GoogleSubscriptionVerifier;
import com.arrivallab.pawprint.domain.subscription.service.verifier.VerifyResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Base64;

/**
 * Google Play Real-time Developer Notifications (RTDN) 핸들러.
 *
 * Pub/Sub 으로 push 받은 base64 데이터를 GoogleDeveloperNotification 으로 파싱.
 * notificationType 에 따라 SubscriptionService 의 apply* 메서드 호출.
 * RENEWED/PURCHASED 등 갱신 알림은 expiresAt 이 페이로드에 없어서 Play Developer API 를
 * 한 번 더 호출(GoogleSubscriptionVerifier)해 최신 만료 시각 받음.
 *
 * docs: https://developer.android.com/google/play/billing/rtdn-reference
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleNotificationHandler {

    private final ObjectMapper objectMapper;
    private final GoogleSubscriptionVerifier verifier;
    private final SubscriptionService subscriptionService;

    public void handle(String base64Data) {
        GoogleDeveloperNotification notification = decode(base64Data);
        log.info("Google notification received: version={} package={} eventTime={}",
                notification.version(), notification.packageName(), notification.eventTimeMillis());

        if (notification.testNotification() != null) {
            log.info("Google RTDN TEST notification — webhook endpoint OK");
            return;
        }

        GoogleDeveloperNotification.SubscriptionNotification sub = notification.subscriptionNotification();
        if (sub == null) {
            // oneTimeProductNotification 은 우리 결제 모델에 없음. 무시.
            log.info("Google RTDN non-subscription notification — skip");
            return;
        }

        int type = sub.notificationType();
        String purchaseToken = sub.purchaseToken();
        String productId = sub.subscriptionId();
        log.info("Google RTDN subscription event: type={} productId={} tokenSuffix=***{}",
                type, productId, suffix(purchaseToken));

        switch (type) {
            // 갱신/구매/회복/재시작 — Play API 재호출해서 최신 expiresAt 받기.
            case 1 /*RECOVERED*/, 2 /*RENEWED*/, 4 /*PURCHASED*/, 7 /*RESTARTED*/ -> {
                VerifyResult result = verifier.verify(new PurchaseRequest(productId, purchaseToken, SubscriptionPlatform.ANDROID));
                subscriptionService.applyGoogleRenewal(purchaseToken, productId, result.expiresAt());
            }
            case 3 /*CANCELED*/ ->
                    subscriptionService.applyGoogleTermination(purchaseToken, SubscriptionService.TerminationReason.CANCEL);
            case 12 /*REVOKED*/ ->
                    subscriptionService.applyGoogleTermination(purchaseToken, SubscriptionService.TerminationReason.REVOKE);
            case 13 /*EXPIRED*/ ->
                    subscriptionService.applyGoogleTermination(purchaseToken, SubscriptionService.TerminationReason.EXPIRED);
            // ON_HOLD(5), IN_GRACE_PERIOD(6), PAUSED(10) — 실제 만료까지 access 유지. 로그만.
            default -> log.info("Google RTDN ignored (no action needed): type={}", type);
        }
    }

    private GoogleDeveloperNotification decode(String base64Data) {
        try {
            byte[] raw = Base64.getDecoder().decode(base64Data);
            return objectMapper.readValue(raw, GoogleDeveloperNotification.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Google RTDN base64/JSON decode failed: " + e.getMessage(), e);
        }
    }

    private String suffix(String s) {
        if (s == null) return "null";
        return s.substring(Math.max(0, s.length() - 6));
    }
}
