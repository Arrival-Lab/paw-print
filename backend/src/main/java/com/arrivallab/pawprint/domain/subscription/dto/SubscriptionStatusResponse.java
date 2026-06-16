package com.arrivallab.pawprint.domain.subscription.dto;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;

import java.time.Clock;
import java.time.LocalDateTime;

public record SubscriptionStatusResponse(
        SubscriptionType subscriptionType,
        LocalDateTime expiresAt,
        boolean isActive
) {
    public static SubscriptionStatusResponse from(User user) {
        return from(user, Clock.systemDefaultZone());
    }

    public static SubscriptionStatusResponse from(User user, Clock clock) {
        boolean active = user.getSubscriptionType().isPaid()
                && (user.getSubscriptionExpiresAt() == null
                || user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now(clock)));
        return new SubscriptionStatusResponse(user.getSubscriptionType(),
                user.getSubscriptionExpiresAt(), active);
    }
}
