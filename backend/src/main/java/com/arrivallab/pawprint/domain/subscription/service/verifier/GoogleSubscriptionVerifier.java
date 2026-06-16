package com.arrivallab.pawprint.domain.subscription.service.verifier;

import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisherScopes;
import com.google.api.services.androidpublisher.model.SubscriptionPurchaseLineItem;
import com.google.api.services.androidpublisher.model.SubscriptionPurchaseV2;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Set;

/**
 * Google Play 결제 영수증(purchaseToken) 검증.
 *
 * AndroidPublisher.purchases().subscriptionsV2().get() (subscriptionsv2) 호출로 만료 시각과 구독 상태 확인.
 * 레거시 v1 purchases().subscriptions() 는 기본요금제+혜택(offer) 신모델에서 paymentState 를 채우지 못해
 * (취소/만료 시 null) 활성 판정이 불안정 → 상태 enum(subscriptionState)이 명확한 v2 로 검증한다.
 */
@Slf4j
@Component
public class GoogleSubscriptionVerifier implements SubscriptionVerifier {

    @Value("${google.play.credentials-path:}")
    private String playCredentialsPath;

    @Value("${google.play.package-name:com.arrivallab.pawprint}")
    private String playPackageName;

    /**
     * 사용자가 구독 혜택을 누리는 상태들. (자동갱신 ACTIVE, 결제유예 IN_GRACE_PERIOD,
     * 자동갱신만 해지했지만 만료 전까지 접근 유지되는 CANCELED) — 이 상태면 expiry 까지 티어 유지.
     * EXPIRED / ON_HOLD / PAUSED / PENDING / UNSPECIFIED 는 접근 불가로 거부.
     */
    private static final Set<String> ENTITLED_STATES = Set.of(
            "SUBSCRIPTION_STATE_ACTIVE",
            "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
            "SUBSCRIPTION_STATE_CANCELED");

    @Override
    public SubscriptionPlatform platform() {
        return SubscriptionPlatform.ANDROID;
    }

    @Override
    public VerifyResult verify(PurchaseRequest request) {
        if (playCredentialsPath == null || playCredentialsPath.isBlank()) {
            log.warn("Google Play credentials not configured");
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
        try (InputStream credStream = openCredentials()) {
            GoogleCredentials credentials = GoogleCredentials.fromStream(credStream)
                    .createScoped(Collections.singleton(AndroidPublisherScopes.ANDROIDPUBLISHER));

            AndroidPublisher publisher = new AndroidPublisher.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("pawprint")
                    .build();

            // v2 는 productId 없이 packageName + purchaseToken 으로 조회. (한 토큰에 line item 여러 개 가능)
            SubscriptionPurchaseV2 purchase = publisher.purchases().subscriptionsv2()
                    .get(playPackageName, request.purchaseToken()).execute();

            String state = purchase.getSubscriptionState();
            if (!ENTITLED_STATES.contains(state)) {
                log.warn("Google Play verify rejected: productId={} subscriptionState={}", request.productId(), state);
                throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
            }
            LocalDateTime expiresAt = extractExpiry(purchase);
            if (expiresAt == null) {
                log.warn("Google Play verify rejected: productId={} state={} but no line item expiryTime",
                        request.productId(), state);
                throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
            }
            return new VerifyResult(expiresAt, request.purchaseToken());
        } catch (BusinessException e) {
            throw e;
        } catch (GoogleJsonResponseException e) {
            // Google API 자체 거부 — HTTP status/메시지는 자격증명을 포함하지 않아 안전하고 진단에 유용.
            log.error("Google Play verify failed: HTTP {} {}", e.getStatusCode(), e.getStatusMessage());
            // 5xx/429 는 Google 측 일시 장애 → 재시도. 4xx(잘못된 토큰/상품 등)는 영구 실패 → ack.
            if (e.getStatusCode() >= 500 || e.getStatusCode() == 429) {
                throw new RetryableVerificationException("Google Play API transient error: HTTP " + e.getStatusCode(), e);
            }
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        } catch (Exception e) {
            // ⚠ e.getMessage() 에 자격증명 내용(파일 경로로 오인된 JSON 등)이 섞여 들어올 수 있어
            //    예외 클래스명만 남긴다. private key 가 로그로 새던 문제 방어.
            log.error("Google Play verify failed: {}", e.getClass().getSimpleName());
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
    }

    /**
     * line item 들 중 가장 늦은 만료 시각을 반환. (업/다운그레이드 전환기엔 여러 item 이 잠시 공존)
     * 만료 시각이 하나도 없으면 null — 호출부에서 거부 처리.
     * expiryTime 은 RFC3339 (예: 2026-06-20T10:00:00Z). 기존 저장 방식과 동일하게 시스템 존 LocalDateTime 으로 변환.
     */
    private LocalDateTime extractExpiry(SubscriptionPurchaseV2 purchase) {
        if (purchase.getLineItems() == null) {
            return null;
        }
        Instant latest = null;
        for (SubscriptionPurchaseLineItem item : purchase.getLineItems()) {
            if (item.getExpiryTime() == null) {
                continue;
            }
            Instant t = Instant.parse(item.getExpiryTime());
            if (latest == null || t.isAfter(latest)) {
                latest = t;
            }
        }
        return latest == null ? null : LocalDateTime.ofInstant(latest, ZoneId.systemDefault());
    }

    /**
     * 자격증명 소스를 연다. ECS 등 컨테이너 환경에선 파일 마운트 대신 env(secret)에 JSON 내용을
     * 통째로 주입하는 경우가 많음 → 값이 '{' 로 시작하면 인라인 JSON 으로 보고 직접 스트림화.
     * 그 외에는 파일 경로로 취급.
     */
    private InputStream openCredentials() throws java.io.IOException {
        String value = playCredentialsPath.trim();
        if (value.startsWith("{")) {
            return new ByteArrayInputStream(value.getBytes(StandardCharsets.UTF_8));
        }
        return new FileInputStream(value);
    }
}
