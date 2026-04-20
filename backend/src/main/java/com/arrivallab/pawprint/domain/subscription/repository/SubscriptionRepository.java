package com.arrivallab.pawprint.domain.subscription.repository;

import com.arrivallab.pawprint.domain.subscription.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    boolean existsByTransactionId(String transactionId);
}
