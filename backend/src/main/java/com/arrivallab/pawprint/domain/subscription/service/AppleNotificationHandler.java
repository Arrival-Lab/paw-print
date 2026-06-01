package com.arrivallab.pawprint.domain.subscription.service;

import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.model.NotificationTypeV2;
import com.apple.itunes.storekit.model.ResponseBodyV2DecodedPayload;
import com.arrivallab.pawprint.domain.subscription.service.verifier.AppleSubscriptionVerifier;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * App Store Server Notifications V2 핸들러.
 *
 * Apple 이 구독 이벤트(시작/갱신/만료/환불/REVOKE 등) 발생 시 우리 서버로 signedPayload(JWS) 를 POST.
 * 우리는 signedPayload 를 SignedDataVerifier 로 검증·디코드 → notificationType 분기 →
 * SubscriptionService 의 apply* 메서드 호출.
 *
 * docs: https://developer.apple.com/documentation/appstoreservernotifications/notificationtype
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppleNotificationHandler {

    private final AppleSubscriptionVerifier verifier;
    private final SubscriptionService subscriptionService;

    public void handle(String signedPayload) {
        ResponseBodyV2DecodedPayload notification = verifier.verifyAndDecodeNotification(signedPayload);
        NotificationTypeV2 type = notification.getNotificationType();
        log.info("Apple notification received: type={} subtype={} uuid={}",
                type, notification.getSubtype(), notification.getNotificationUUID());

        if (type == null) {
            log.warn("Apple notification missing type — skipping");
            return;
        }

        // TEST 알림은 Apple 이 webhook 등록 확인용으로 보냄. 로그만.
        if (type == NotificationTypeV2.TEST) {
            log.info("Apple notification TEST received — webhook endpoint OK");
            return;
        }

        String signedTransactionInfo = notification.getData() == null
                ? null
                : notification.getData().getSignedTransactionInfo();
        if (signedTransactionInfo == null) {
            log.warn("Apple notification missing signedTransactionInfo — type={}", type);
            return;
        }

        JWSTransactionDecodedPayload tx = verifier.decodeTransactionPayload(signedTransactionInfo);
        String originalTransactionId = tx.getOriginalTransactionId();
        String productId = tx.getProductId();
        Long expiresMs = tx.getExpiresDate();
        if (originalTransactionId == null) {
            log.warn("Apple transaction missing originalTransactionId — type={}", type);
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
        LocalDateTime expiresAt = expiresMs == null
                ? null
                : LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());

        switch (type) {
            // 구독 시작/갱신 — 새 만료 시각으로 user 갱신
            case SUBSCRIBED, DID_RENEW, OFFER_REDEEMED -> {
                if (expiresAt == null) {
                    log.warn("Apple {} missing expiresDate — originalTransactionId={}", type, originalTransactionId);
                    return;
                }
                subscriptionService.applyAppleRenewal(originalTransactionId, productId, expiresAt);
            }
            // 만료/grace period 종료 — FREE 강등
            case EXPIRED, GRACE_PERIOD_EXPIRED ->
                    subscriptionService.applyAppleTermination(originalTransactionId, SubscriptionService.TerminationReason.EXPIRED);
            case REFUND ->
                    subscriptionService.applyAppleTermination(originalTransactionId, SubscriptionService.TerminationReason.REFUND);
            case REVOKE ->
                    subscriptionService.applyAppleTermination(originalTransactionId, SubscriptionService.TerminationReason.REVOKE);
            // 자동 갱신 off/플랜 변경 등 — 실제 만료 시점까지 access 유지. 로그만.
            default -> log.info("Apple notification ignored (no action needed): type={} subtype={}",
                    type, notification.getSubtype());
        }
    }
}
