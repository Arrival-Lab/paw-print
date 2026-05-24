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
        return SubscriptionStatusResponse.from(user);
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
        return SubscriptionStatusResponse.from(user);
    }

    @Transactional(readOnly = true)
    public SubscriptionStatusResponse getStatus(Long userId) {
        return SubscriptionStatusResponse.from(getUser(userId));
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
