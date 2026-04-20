package com.arrivallab.pawprint.domain.auth.service;

import com.arrivallab.pawprint.domain.auth.dto.AuthResponse;
import com.arrivallab.pawprint.domain.auth.dto.UserResponse;
import com.arrivallab.pawprint.domain.user.entity.Provider;
import com.arrivallab.pawprint.domain.user.entity.RefreshToken;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.RefreshTokenRepository;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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

    public AuthResponse googleLogin(String idToken) {
        GoogleAuthService.GoogleUserInfo info = googleAuthService.verify(idToken);
        User user = userRepository.findByProviderAndProviderId(Provider.GOOGLE, info.providerId())
                .orElseGet(() -> userRepository.save(User.builder()
                        .provider(Provider.GOOGLE)
                        .providerId(info.providerId())
                        .email(info.email())
                        .name(info.name())
                        .profileImage(info.profileImage())
                        .subscriptionType(SubscriptionType.FREE)
                        .build()));
        return issueTokens(user);
    }

    public AuthResponse appleLogin(String identityToken) {
        AppleAuthService.AppleUserInfo info = appleAuthService.verify(identityToken);
        User user = userRepository.findByProviderAndProviderId(Provider.APPLE, info.sub())
                .orElseGet(() -> {
                    String email = info.email() != null ? info.email() : "apple_" + info.sub() + "@privaterelay.appleid.com";
                    return userRepository.save(User.builder()
                            .provider(Provider.APPLE)
                            .providerId(info.sub())
                            .email(email)
                            .name("Apple User")
                            .subscriptionType(SubscriptionType.FREE)
                            .build());
                });
        return issueTokens(user);
    }

    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException(ErrorCode.EXPIRED_TOKEN);
        }

        User user = refreshToken.getUser();
        refreshTokenRepository.delete(refreshToken);
        return issueTokens(user);
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

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getSubscriptionType());
        String refreshTokenValue = jwtTokenProvider.generateRefreshToken();

        refreshTokenRepository.deleteByUser(user);

        LocalDateTime expiresAt = LocalDateTime.now().plus(refreshExpiration, ChronoUnit.MILLIS);
        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(expiresAt)
                .build());

        return new AuthResponse(accessToken, refreshTokenValue, UserResponse.from(user));
    }
}
