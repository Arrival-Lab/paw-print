package com.arrivallab.pawprint.domain.subscription.service;

import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.dto.SubscriptionStatusResponse;
import com.arrivallab.pawprint.domain.subscription.entity.Subscription;
import com.arrivallab.pawprint.domain.subscription.entity.SubscriptionStatus;
import com.arrivallab.pawprint.domain.subscription.repository.SubscriptionRepository;
import com.arrivallab.pawprint.domain.subscription.service.verifier.SubscriptionVerifier;
import com.arrivallab.pawprint.domain.subscription.service.verifier.VerifyResult;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final List<SubscriptionVerifier> verifiers;
    private final Clock clock;

    public SubscriptionStatusResponse purchase(Long userId, PurchaseRequest request) {
        log.info("purchase request: userId={}, productId={}, platform={}", userId, request.productId(), request.platform());
        User user = getUser(userId);
        VerifyResult result = verify(request);
        log.info("purchase verified: userId={}, transactionId={}, expiresAt={}", userId, result.transactionId(), result.expiresAt());
        if (subscriptionRepository.existsByTransactionId(result.transactionId())) {
            log.warn("purchase rejected — transaction already claimed: userId={}, transactionId={}", userId, result.transactionId());
            throw new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED);
        }
        activateSubscription(user, request, result);
        log.info("purchase activated: userId={}, tier={}", userId, user.getSubscriptionType());
        return SubscriptionStatusResponse.from(user, clock);
    }

    public SubscriptionStatusResponse restore(Long userId, PurchaseRequest request) {
        log.info("restore request: userId={}, productId={}, platform={}", userId, request.productId(), request.platform());
        User user = getUser(userId);
        VerifyResult result = verify(request);
        log.info("restore verified: userId={}, transactionId={}", userId, result.transactionId());
        if (!subscriptionRepository.existsByTransactionId(result.transactionId())) {
            activateSubscription(user, request, result);
            log.info("restore activated: userId={}, tier={}", userId, user.getSubscriptionType());
        } else {
            log.info("restore skipped — transaction already claimed by another user: transactionId={}", result.transactionId());
        }
        return SubscriptionStatusResponse.from(user, clock);
    }

    @Transactional(readOnly = true)
    public SubscriptionStatusResponse getStatus(Long userId) {
        return SubscriptionStatusResponse.from(getUser(userId), clock);
    }

    private VerifyResult verify(PurchaseRequest request) {
        return verifiers.stream()
                .filter(v -> v.platform() == request.platform())
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.PURCHASE_VERIFICATION_FAILED))
                .verify(request);
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

    // ===== webhook (Apple ASSNV2 / Google RTDN) 공통 처리 =====

    /**
     * Apple 갱신/구독 시작 webhook 처리. originalTransactionId 로 기존 row 조회.
     * 처음 구매 시 transactionId == originalTransactionId 라서 같은 컬럼으로 찾을 수 있음.
     * 못 찾으면 무시 (다른 환경의 알림이거나 webhook 이 client purchase 보다 먼저 도착한 경우).
     */
    public void applyAppleRenewal(String originalTransactionId, String productId, LocalDateTime expiresAt) {
        subscriptionRepository.findByTransactionId(originalTransactionId).ifPresentOrElse(
                sub -> {
                    sub.renew(expiresAt);
                    sub.getUser().updateSubscription(tierFromProductId(productId), expiresAt);
                    log.info("Apple webhook renewal applied: subId={} userId={} expiresAt={}",
                            sub.getId(), sub.getUser().getId(), expiresAt);
                },
                () -> log.warn("Apple webhook renewal — subscription not found: originalTransactionId={}", originalTransactionId)
        );
    }

    /** Apple 만료/환불/취소/revoke — User 를 FREE 로 강등. */
    public void applyAppleTermination(String originalTransactionId, TerminationReason reason) {
        subscriptionRepository.findByTransactionId(originalTransactionId).ifPresentOrElse(
                sub -> {
                    switch (reason) {
                        case EXPIRED -> sub.expire();
                        case REFUND, REVOKE, CANCEL -> sub.cancel();
                    }
                    sub.getUser().updateSubscription(SubscriptionType.FREE, null);
                    log.info("Apple webhook termination applied: subId={} userId={} reason={}",
                            sub.getId(), sub.getUser().getId(), reason);
                },
                () -> log.warn("Apple webhook termination — subscription not found: originalTransactionId={}", originalTransactionId)
        );
    }

    /** Google 갱신/구매 webhook 처리. purchaseToken 으로 row 조회. */
    public void applyGoogleRenewal(String purchaseToken, String productId, LocalDateTime expiresAt) {
        subscriptionRepository.findByPurchaseToken(purchaseToken).ifPresentOrElse(
                sub -> {
                    sub.renew(expiresAt);
                    sub.getUser().updateSubscription(tierFromProductId(productId), expiresAt);
                    log.info("Google webhook renewal applied: subId={} userId={} expiresAt={}",
                            sub.getId(), sub.getUser().getId(), expiresAt);
                },
                () -> log.warn("Google webhook renewal — subscription not found: purchaseToken=***{}",
                        purchaseToken.substring(Math.max(0, purchaseToken.length() - 6)))
        );
    }

    /** Google 만료/취소/revoke. */
    public void applyGoogleTermination(String purchaseToken, TerminationReason reason) {
        subscriptionRepository.findByPurchaseToken(purchaseToken).ifPresentOrElse(
                sub -> {
                    switch (reason) {
                        case EXPIRED -> sub.expire();
                        case REFUND, REVOKE, CANCEL -> sub.cancel();
                    }
                    sub.getUser().updateSubscription(SubscriptionType.FREE, null);
                    log.info("Google webhook termination applied: subId={} userId={} reason={}",
                            sub.getId(), sub.getUser().getId(), reason);
                },
                () -> log.warn("Google webhook termination — subscription not found: purchaseToken=***{}",
                        purchaseToken.substring(Math.max(0, purchaseToken.length() - 6)))
        );
    }

    public enum TerminationReason { EXPIRED, REFUND, REVOKE, CANCEL }

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
