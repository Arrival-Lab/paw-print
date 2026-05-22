package com.arrivallab.pawprint.domain.subscription.service;

import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.dto.SubscriptionStatusResponse;
import com.arrivallab.pawprint.domain.subscription.entity.Subscription;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionStatus;
import com.arrivallab.pawprint.domain.subscription.repository.SubscriptionRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisherScopes;
import com.google.api.services.androidpublisher.model.SubscriptionPurchase;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.FileInputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SubscriptionService {

    private static final String APPLE_VERIFY_PRODUCTION = "https://buy.itunes.apple.com/verifyReceipt";
    private static final String APPLE_VERIFY_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";
    private static final int APPLE_STATUS_SANDBOX = 21007;

    @Value("${apple.shared-secret:}")
    private String appleSharedSecret;

    @Value("${google.play.credentials-path:}")
    private String playCredentialsPath;

    @Value("${google.play.package-name:com.arrivallab.pawprint}")
    private String playPackageName;

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public SubscriptionStatusResponse purchase(Long userId, PurchaseRequest request) {
        User user = getUser(userId);
        VerifyResult result = verify(request);
        if (subscriptionRepository.existsByTransactionId(result.transactionId())) {
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
        activateSubscription(user, request, result);
        return SubscriptionStatusResponse.from(user);
    }

    public SubscriptionStatusResponse restore(Long userId, PurchaseRequest request) {
        User user = getUser(userId);
        VerifyResult result = verify(request);
        if (!subscriptionRepository.existsByTransactionId(result.transactionId())) {
            activateSubscription(user, request, result);
        }
        return SubscriptionStatusResponse.from(user);
    }

    @Transactional(readOnly = true)
    public SubscriptionStatusResponse getStatus(Long userId) {
        return SubscriptionStatusResponse.from(getUser(userId));
    }

    private record VerifyResult(LocalDateTime expiresAt, String transactionId) {}

    private VerifyResult verify(PurchaseRequest request) {
        if (request.platform() == SubscriptionPlatform.IOS) {
            return verifyIos(request.purchaseToken());
        } else {
            return verifyAndroid(request.productId(), request.purchaseToken());
        }
    }

    private VerifyResult verifyIos(String receiptData) {
        try {
            VerifyResult result = callAppleVerify(receiptData, APPLE_VERIFY_PRODUCTION);
            if (result != null) return result;
        } catch (AppleSandboxException e) {
            try {
                VerifyResult result = callAppleVerify(receiptData, APPLE_VERIFY_SANDBOX);
                if (result != null) return result;
            } catch (Exception ex) {
                log.error("Apple sandbox verify failed: {}", ex.getMessage());
            }
        } catch (Exception e) {
            log.error("Apple production verify failed: {}", e.getMessage());
        }
        throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
    }

    private VerifyResult callAppleVerify(String receiptData, String url) {
        Map<String, String> body = new HashMap<>();
        body.put("receipt-data", receiptData);
        body.put("password", appleSharedSecret);
        body.put("exclude-old-transactions", "true");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.POST, new HttpEntity<>(body, headers), String.class);

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            int status = root.path("status").asInt(-1);
            if (status == APPLE_STATUS_SANDBOX) throw new AppleSandboxException();
            if (status != 0) return null;

            JsonNode info = root.path("latest_receipt_info");
            if (info.isArray() && !info.isEmpty()) {
                JsonNode latest = info.get(0);
                long expiresMs = latest.path("expires_date_ms").asLong();
                String transactionId = latest.path("transaction_id").asText();
                LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());
                return new VerifyResult(expiresAt, transactionId);
            }
        } catch (AppleSandboxException e) {
            throw e;
        } catch (Exception e) {
            log.error("Apple response parse error: {}", e.getMessage());
        }
        return null;
    }

    private VerifyResult verifyAndroid(String productId, String purchaseToken) {
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
                    .get(playPackageName, productId, purchaseToken).execute();

            if (purchase.getPaymentState() == null || purchase.getPaymentState() != 1) {
                throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
            }
            long expiresMs = purchase.getExpiryTimeMillis();
            LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());
            return new VerifyResult(expiresAt, purchaseToken);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google Play verify failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
    }

    private void activateSubscription(User user, PurchaseRequest request, VerifyResult result) {
        subscriptionRepository.save(Subscription.builder()
                .user(user)
                .platform(request.platform())
                .productId(request.productId())
                .purchaseToken(request.purchaseToken())
                .transactionId(result.transactionId())
                .status(SubscriptionStatus.ACTIVE)
                .startedAt(LocalDateTime.now())
                .expiresAt(result.expiresAt())
                .build());
        user.updateSubscription(tierFromProductId(request.productId()), result.expiresAt());
    }

    /**
     * 스토어 product ID 에서 구독 티어 추출.
     * iOS: com.arrivallab.pawprint.{friend|family|premium}.{monthly|yearly}
     * Android: pawprint_{friend|family|premium}_{monthly|yearly}
     * 알 수 없는 ID 는 레거시 호환을 위해 PREMIUM 으로 처리.
     */
    private SubscriptionType tierFromProductId(String productId) {
        if (productId == null) return SubscriptionType.PREMIUM;
        String id = productId.toLowerCase();
        if (id.contains("friend")) return SubscriptionType.FRIEND;
        if (id.contains("family")) return SubscriptionType.FAMILY;
        return SubscriptionType.PREMIUM;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private static class AppleSandboxException extends RuntimeException {}
}
