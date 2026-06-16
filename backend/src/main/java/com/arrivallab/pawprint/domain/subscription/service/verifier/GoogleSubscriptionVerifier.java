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
import com.google.api.services.androidpublisher.model.SubscriptionPurchase;
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

/**
 * Google Play 결제 영수증(purchaseToken) 검증.
 * AndroidPublisher.purchases().subscriptions().get() 호출 결과로 만료 시각과 결제 상태 확인.
 */
@Slf4j
@Component
public class GoogleSubscriptionVerifier implements SubscriptionVerifier {

    @Value("${google.play.credentials-path:}")
    private String playCredentialsPath;

    @Value("${google.play.package-name:com.arrivallab.pawprint}")
    private String playPackageName;

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

            SubscriptionPurchase purchase = publisher.purchases().subscriptions()
                    .get(playPackageName, request.productId(), request.purchaseToken()).execute();

            // paymentState: 1=결제완료, 2=무료체험(free trial) — 둘 다 유효한 활성 구독.
            // (0=결제대기, 3=지연 변경 대기, null=만료/취소). 무료 체험으로 시작하는 신규 구독자는
            // PURCHASED 이벤트에서 paymentState=2 로 들어오므로 1만 허용하면 영원히 검증 실패한다.
            Integer paymentState = purchase.getPaymentState();
            if (paymentState == null || (paymentState != 1 && paymentState != 2)) {
                // 진단용: 실제 값을 찍어 어떤 케이스인지 확인. paymentState=null 인데 expiryTimeMillis 가
                // 유효한 미래값이면 → 신모델(기본요금제+혜택)을 레거시 v1 API 가 못 채우는 케이스.
                log.warn("Google Play verify rejected: productId={} paymentState={} expiryTimeMillis={} cancelReason={}",
                        request.productId(), paymentState, purchase.getExpiryTimeMillis(), purchase.getCancelReason());
                throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
            }
            long expiresMs = purchase.getExpiryTimeMillis();
            LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());
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
