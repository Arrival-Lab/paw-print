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
import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import com.apple.itunes.storekit.verification.VerificationException;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.AndroidPublisherScopes;
import com.google.api.services.androidpublisher.model.SubscriptionPurchase;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.FileInputStream;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SubscriptionService {

    @Value("${apple.bundle-id:com.arrivallab.pawprint}")
    private String appleBundleId;

    @Value("${google.play.credentials-path:}")
    private String playCredentialsPath;

    @Value("${google.play.package-name:com.arrivallab.pawprint}")
    private String playPackageName;

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    private SignedDataVerifier productionVerifier;
    private SignedDataVerifier sandboxVerifier;

    @PostConstruct
    void initAppleVerifiers() throws Exception {
        Set<InputStream> productionCAs = loadAppleRootCAs();
        Set<InputStream> sandboxCAs = loadAppleRootCAs();
        try {
            productionVerifier = new SignedDataVerifier(productionCAs, appleBundleId, null, Environment.PRODUCTION, false);
            sandboxVerifier = new SignedDataVerifier(sandboxCAs, appleBundleId, null, Environment.SANDBOX, false);
        } finally {
            closeQuietly(productionCAs);
            closeQuietly(sandboxCAs);
        }
    }

    private static void closeQuietly(Set<InputStream> streams) {
        for (InputStream is : streams) {
            try { is.close(); } catch (Exception ignored) {}
        }
    }

    private static final String[] APPLE_ROOT_CA_PATHS = {
            "apple-root-ca/AppleRootCA-G3.cer",
            "apple-root-ca/AppleRootCA-G2.cer",
            "apple-root-ca/AppleIncRootCertificate.cer",
            "apple-root-ca/AppleComputerRootCertificate.cer",
    };

    private Set<InputStream> loadAppleRootCAs() throws java.io.IOException {
        Set<InputStream> streams = new HashSet<>();
        for (String path : APPLE_ROOT_CA_PATHS) {
            InputStream is = getClass().getClassLoader().getResourceAsStream(path);
            if (is == null) {
                throw new IllegalStateException("Apple Root CA not found on classpath: " + path);
            }
            streams.add(is);
        }
        return streams;
    }

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

    private VerifyResult verifyIos(String signedTransaction) {
        JWSTransactionDecodedPayload payload = decodeWithFallback(signedTransaction);
        Long expiresMs = payload.getExpiresDate();
        String transactionId = payload.getTransactionId();
        if (expiresMs == null || transactionId == null) {
            log.warn("Apple JWS payload missing fields: txId={}, expires={}", transactionId, expiresMs);
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
        LocalDateTime expiresAt = LocalDateTime.ofInstant(Instant.ofEpochMilli(expiresMs), ZoneId.systemDefault());
        return new VerifyResult(expiresAt, transactionId);
    }

    private JWSTransactionDecodedPayload decodeWithFallback(String signedTransaction) {
        try {
            return productionVerifier.verifyAndDecodeTransaction(signedTransaction);
        } catch (VerificationException prodEx) {
            try {
                return sandboxVerifier.verifyAndDecodeTransaction(signedTransaction);
            } catch (VerificationException sandboxEx) {
                log.warn("Apple JWS verification failed — prod: {}, sandbox: {}", prodEx.getMessage(), sandboxEx.getMessage());
                throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
            }
        }
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
}
