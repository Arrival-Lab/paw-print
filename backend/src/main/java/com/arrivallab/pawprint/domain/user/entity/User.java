package com.arrivallab.pawprint.domain.user.entity;

import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 20, unique = true)
    private String nickname;

    @Column(name = "profile_image")
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Provider provider;

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    @Column(name = "apple_sub")
    private String appleSub;

    @Column(name = "google_sub")
    private String googleSub;

    @Column(name = "kakao_sub")
    private String kakaoSub;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_type", nullable = false, length = 20)
    @Builder.Default
    private SubscriptionType subscriptionType = SubscriptionType.FREE;

    @Column(name = "subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;

    @Column(name = "fcm_token")
    private String fcmToken;

    // 알림 카테고리 on/off — false 면 해당 카테고리 스케줄러가 발송 skip.
    @Column(name = "notify_vaccine", nullable = false)
    @Builder.Default
    private Boolean notifyVaccine = true;

    @Column(name = "notify_care", nullable = false)
    @Builder.Default
    private Boolean notifyCare = true;

    // UI/콘텐츠 언어 (ko/en/ja). 푸시 등 비동기 발송 시 사용자 언어 결정 기준.
    @Column(nullable = false, length = 8)
    @Builder.Default
    private String locale = "ko";

    public void updateLocale(String locale) {
        this.locale = locale;
    }

    public void updateNotificationPreferences(Boolean notifyVaccine, Boolean notifyCare) {
        if (notifyVaccine != null) this.notifyVaccine = notifyVaccine;
        if (notifyCare != null) this.notifyCare = notifyCare;
    }

    public void updateSubscription(SubscriptionType type, LocalDateTime expiresAt) {
        this.subscriptionType = type;
        this.subscriptionExpiresAt = expiresAt;
    }

    public void updateProfile(String name, String profileImage) {
        this.name = name;
        this.profileImage = profileImage;
    }

    public void updateFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void linkProviderSub(Provider provider, String sub) {
        switch (provider) {
            case APPLE -> this.appleSub = sub;
            case GOOGLE -> this.googleSub = sub;
        }
    }
}
