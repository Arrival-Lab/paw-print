package com.arrivallab.pawprint.domain.subscription.service.verifier;

import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisherScopes;
import com.google.api.services.androidpublisher.model.SubscriptionPurchase;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.FileInputStream;
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
        try (FileInputStream credStream = new FileInputStream(playCredentialsPath)) {
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

            if (purchase.getPaymentState() == null || purchase.getPaymentState() != 1) {
                throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
            }
            long expiresMs = purchase.getExpiryTimeMillis();
            LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());
            return new VerifyResult(expiresAt, request.purchaseToken());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google Play verify failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
    }
}
