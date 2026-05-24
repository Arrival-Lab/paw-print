package com.arrivallab.pawprint.domain.subscription.service.verifier;

import com.apple.itunes.storekit.model.Environment;
import com.apple.itunes.storekit.model.JWSTransactionDecodedPayload;
import com.apple.itunes.storekit.verification.SignedDataVerifier;
import com.apple.itunes.storekit.verification.VerificationException;
import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionPlatform;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.Set;

/**
 * iOS 결제 영수증(JWS Transaction) 검증. App Store Server Library 의
 * SignedDataVerifier 를 production/sandbox 양쪽으로 준비해 차례로 시도.
 * Sandbox 응답이 production verifier 에서 실패하므로 fallback 필수.
 */
@Slf4j
@Component
public class AppleSubscriptionVerifier implements SubscriptionVerifier {

    @Value("${apple.bundle-id:com.arrivallab.pawprint}")
    private String appleBundleId;

    /** App Store Connect 의 앱 Apple ID — production verifier 필수. 미설정 시 sandbox 만 작동. */
    @Value("${apple.app-apple-id:}")
    private String appleAppleIdRaw;

    private SignedDataVerifier productionVerifier;
    private SignedDataVerifier sandboxVerifier;

    private static final String[] APPLE_ROOT_CA_PATHS = {
            "apple-root-ca/AppleRootCA-G3.cer",
            "apple-root-ca/AppleRootCA-G2.cer",
            "apple-root-ca/AppleIncRootCertificate.cer",
            "apple-root-ca/AppleComputerRootCertificate.cer",
    };

    @Override
    public SubscriptionPlatform platform() {
        return SubscriptionPlatform.IOS;
    }

    @PostConstruct
    void init() {
        Long appleAppleId = parseAppleAppleId(appleAppleIdRaw);
        Set<InputStream> productionCAs = null;
        Set<InputStream> sandboxCAs = null;
        try {
            sandboxCAs = loadAppleRootCAs();
            sandboxVerifier = new SignedDataVerifier(sandboxCAs, appleBundleId, appleAppleId, Environment.SANDBOX, false);
            if (appleAppleId != null) {
                productionCAs = loadAppleRootCAs();
                productionVerifier = new SignedDataVerifier(productionCAs, appleBundleId, appleAppleId, Environment.PRODUCTION, false);
                log.info("Apple SignedDataVerifier initialized (bundleId={}, appAppleId={})", appleBundleId, appleAppleId);
            } else {
                log.warn("apple.app-apple-id not configured — production verifier disabled, only sandbox JWS will be accepted");
            }
        } catch (Throwable t) {
            log.error("Apple SignedDataVerifier init FAILED: {}", t.toString(), t);
            throw new IllegalStateException("Apple SignedDataVerifier init failed: " + t.getMessage(), t);
        } finally {
            if (productionCAs != null) closeQuietly(productionCAs);
            if (sandboxCAs != null) closeQuietly(sandboxCAs);
        }
    }

    @Override
    public VerifyResult verify(PurchaseRequest request) {
        JWSTransactionDecodedPayload payload = decodeWithFallback(request.purchaseToken());
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
        VerificationException prodEx = null;
        if (productionVerifier != null) {
            try {
                return productionVerifier.verifyAndDecodeTransaction(signedTransaction);
            } catch (VerificationException e) {
                prodEx = e;
            }
        }
        try {
            return sandboxVerifier.verifyAndDecodeTransaction(signedTransaction);
        } catch (VerificationException sandboxEx) {
            log.warn("Apple JWS verification failed — prod: {}, sandbox: {}",
                    prodEx == null ? "n/a" : prodEx.getMessage(), sandboxEx.getMessage());
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
    }

    private static Long parseAppleAppleId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalStateException("apple.app-apple-id must be a numeric Apple ID, got: " + raw, e);
        }
    }

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

    private static void closeQuietly(Set<InputStream> streams) {
        for (InputStream is : streams) {
            try { is.close(); } catch (Exception ignored) {}
        }
    }
}
