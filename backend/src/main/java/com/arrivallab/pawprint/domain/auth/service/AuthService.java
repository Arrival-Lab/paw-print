package com.arrivallab.pawprint.domain.auth.service;

import com.arrivallab.pawprint.domain.auth.dto.AuthResponse;
import com.arrivallab.pawprint.domain.auth.dto.UserResponse;
import com.arrivallab.pawprint.domain.user.entity.Provider;
import com.arrivallab.pawprint.domain.user.entity.RefreshToken;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.RefreshTokenRepository;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.domain.user.service.AutoNicknameGenerator;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuthService {

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final GoogleAuthService googleAuthService;
    private final AppleAuthService appleAuthService;
    private final AutoNicknameGenerator autoNicknameGenerator;

    public AuthResponse googleLogin(String idToken, String deviceId) {
        GoogleAuthService.GoogleUserInfo info = googleAuthService.verify(idToken);
        return googleLoginWithInfo(info.email(), info.name(), info.profileImage(), info.providerId(), deviceId);
    }

    public AuthResponse googleLoginWithInfo(String email, String name, String profileImage, String providerId, String deviceId) {
        User user = userRepository.findByGoogleSub(providerId)
                .or(() -> userRepository.findByProviderAndProviderId(Provider.GOOGLE, providerId))
                .or(() -> email != null ? userRepository.findByEmail(email) : Optional.empty())
                .orElseGet(() -> User.builder()
                        .provider(Provider.GOOGLE)
                        .providerId(providerId)
                        .email(email)
                        .name(name != null ? name : "Google User")
                        // 가입 시 자동 닉네임 부여 — 강제 onboarding 모달 진입 제거. 사용자가 원하면 마이페이지에서 수정.
                        .nickname(autoNicknameGenerator.generateUnique())
                        .profileImage(profileImage)
                        .subscriptionType(SubscriptionType.FREE)
                        .build());

        user.linkProviderSub(Provider.GOOGLE, providerId);
        return issueTokens(userRepository.save(user), deviceId);
    }

    public AuthResponse appleLogin(String identityToken, String deviceId) {
        AppleAuthService.AppleUserInfo info = appleAuthService.verify(identityToken);
        String email = info.email();

        User user = userRepository.findByAppleSub(info.sub())
                .or(() -> userRepository.findByProviderAndProviderId(Provider.APPLE, info.sub()))
                .or(() -> email != null ? userRepository.findByEmail(email) : Optional.empty())
                .orElseGet(() -> {
                    String safeEmail = email != null ? email : "apple_" + info.sub() + "@privaterelay.appleid.com";
                    return User.builder()
                            .provider(Provider.APPLE)
                            .providerId(info.sub())
                            .email(safeEmail)
                            .name("Apple User")
                            // 가입 시 자동 닉네임 부여 — Apple 의 user.name 기본값 "Apple User" 가 공유 펫 등에서
                            // 그대로 노출되는 문제도 함께 회피.
                            .nickname(autoNicknameGenerator.generateUnique())
                            .subscriptionType(SubscriptionType.FREE)
                            .build();
                });

        user.linkProviderSub(Provider.APPLE, info.sub());
        return issueTokens(userRepository.save(user), deviceId);
    }

    public AuthResponse refresh(String refreshTokenValue, String deviceId) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        if (refreshToken.isRotated()) {
            // 이미 사용된 토큰 재제출 → 탈취 가능성, 해당 유저의 모든 세션 무효화
            log.warn("Refresh token reuse detected, invalidating all sessions: userId={}",
                    refreshToken.getUser().getId());
            refreshTokenRepository.deleteByUser(refreshToken.getUser());
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException(ErrorCode.EXPIRED_TOKEN);
        }

        User user = refreshToken.getUser();
        // refresh 시 deviceId 가 들어오면 새 토큰에 박음. 없으면 기존 토큰의 deviceId 보존
        // (구버전 클라이언트가 deviceId 안 보내는 경우 회귀 동작 유지).
        String effectiveDeviceId = deviceId != null ? deviceId : refreshToken.getDeviceId();
        refreshToken.markAsRotated();
        // 회전 토큰은 SubscriptionExpiryScheduler.cleanRotatedTokens (10분 grace) 가 청소.
        // 그 사이에 재제출되면 위 isRotated() 분기로 reuse detection 동작.
        return issueRotatedTokens(user, effectiveDeviceId);
    }

    /**
     * 회전 경로 — 새 refresh 토큰만 발급. 직전 토큰(rotated=true)은 reuse detection 윈도우 동안 보존.
     * fresh 로그인 경로(issueTokens)와 달리 deleteByUser 안 함.
     */
    private AuthResponse issueRotatedTokens(User user, String deviceId) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getSubscriptionType());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken();

        LocalDateTime expiresAt = LocalDateTime.now().plus(refreshExpiration, ChronoUnit.MILLIS);
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(expiresAt)
                .deviceId(deviceId)
                .build());

        return new AuthResponse(accessToken, refreshTokenValue, UserResponse.from(user));
    }

    public void logout(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        refreshTokenRepository.deleteByUser(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    public void updateFcmToken(Long userId, String fcmToken) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateFcmToken(fcmToken);
    }

    public AuthResponse devLogin(String deviceId) {
        User user = userRepository.findByProviderAndProviderId(Provider.GOOGLE, "dev-local")
                .orElseGet(() -> userRepository.save(User.builder()
                        .provider(Provider.GOOGLE)
                        .providerId("dev-local")
                        .email("dev@pawprint.local")
                        .name("Dev User (PREMIUM)")
                        .subscriptionType(SubscriptionType.PREMIUM)
                        .subscriptionExpiresAt(LocalDateTime.now().plusYears(10))
                        .build()));
        if (user.getSubscriptionType() != SubscriptionType.PREMIUM) {
            user.updateSubscription(SubscriptionType.PREMIUM, LocalDateTime.now().plusYears(10));
        }
        return issueTokens(user, deviceId);
    }

    public AuthResponse devLoginFree(String deviceId) {
        User user = userRepository.findByProviderAndProviderId(Provider.GOOGLE, "dev-local-free")
                .orElseGet(() -> userRepository.save(User.builder()
                        .provider(Provider.GOOGLE)
                        .providerId("dev-local-free")
                        .email("dev-free@pawprint.local")
                        .name("Dev User (FREE)")
                        .subscriptionType(SubscriptionType.FREE)
                        .build()));
        if (user.getSubscriptionType() != SubscriptionType.FREE) {
            user.updateSubscription(SubscriptionType.FREE, null);
        }
        return issueTokens(user, deviceId);
    }

    /**
     * deviceId: 디바이스 식별자. null 이면 멀티 디바이스 분리 미적용 (구버전 클라이언트 호환).
     * deviceId 가 있으면 같은 (user, deviceId) 의 기존 토큰을 일괄 정리 — 다른 디바이스 세션은 보존.
     * 만료된 본인 토큰도 함께 정리해 누적 방지.
     */
    private AuthResponse issueTokens(User user, String deviceId) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getSubscriptionType());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken();

        if (deviceId != null) {
            refreshTokenRepository.deleteByUserAndDeviceId(user, deviceId);
        }
        refreshTokenRepository.deleteByUserAndExpiresAtBefore(user, LocalDateTime.now());

        LocalDateTime expiresAt = LocalDateTime.now().plus(refreshExpiration, ChronoUnit.MILLIS);
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(expiresAt)
                .deviceId(deviceId)
                .build());

        return new AuthResponse(accessToken, refreshTokenValue, UserResponse.from(user));
    }
}
