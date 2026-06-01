package com.arrivallab.pawprint.domain.subscription.repository;

import com.arrivallab.pawprint.domain.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    boolean existsByTransactionId(String transactionId);

    /**
     * Apple 의 originalTransactionId 로 조회. 첫 구매 시 transactionId == originalTransactionId 이므로
     * 갱신 webhook 이 와도 originalTransactionId 로 같은 row 를 찾을 수 있음.
     */
    Optional<Subscription> findByTransactionId(String transactionId);

    /**
     * Google RTDN 이벤트는 purchaseToken 으로 식별. 갱신 시 purchaseToken 변경되는 경우는
     * V3 Subscriptions API 가 새 token 발급 시점에 별도 알림을 보내며 우린 그것도 동일 row 갱신.
     */
    Optional<Subscription> findByPurchaseToken(String purchaseToken);
}
