package com.arrivallab.pawprint.domain.auth.dto;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String email,
        String name,
        String nickname,
        String profileImage,
        SubscriptionType subscriptionType,
        LocalDateTime subscriptionExpiresAt,
        String locale,
        String timezone
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getNickname(),
                user.getProfileImage(),
                user.getSubscriptionType(),
                user.getSubscriptionExpiresAt(),
                user.getLocale(),
                user.getTimezone()
        );
    }
}
