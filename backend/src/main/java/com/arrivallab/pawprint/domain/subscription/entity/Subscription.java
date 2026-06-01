package com.arrivallab.pawprint.domain.subscription.entity;

import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Subscription extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SubscriptionPlatform platform;

    @Column(name = "product_id", nullable = false, length = 255)
    private String productId;

    @Column(name = "purchase_token", nullable = false, columnDefinition = "TEXT")
    private String purchaseToken;

    @Column(name = "transaction_id", unique = true)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public void expire() {
        this.status = SubscriptionStatus.EXPIRED;
    }

    public void cancel() {
        this.status = SubscriptionStatus.CANCELLED;
    }

    /** webhook 으로 갱신 알림 수신 시 호출. expiresAt 연장 + 상태 ACTIVE 복귀. */
    public void renew(LocalDateTime newExpiresAt) {
        this.expiresAt = newExpiresAt;
        this.status = SubscriptionStatus.ACTIVE;
    }
}
