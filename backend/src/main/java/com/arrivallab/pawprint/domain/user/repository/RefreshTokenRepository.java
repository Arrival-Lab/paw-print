package com.arrivallab.pawprint.domain.user.repository;

import com.arrivallab.pawprint.domain.user.entity.RefreshToken;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    void deleteByRotatedAtBefore(java.time.LocalDateTime cutoff);

    /** 특정 유저의 만료된 토큰만 정리 — issueTokens 호출 시 같은 유저 누적 방지용. */
    void deleteByUserAndExpiresAtBefore(User user, java.time.LocalDateTime cutoff);

    /** 전체 만료 토큰 일괄 정리 — scheduler 가 일별 호출. */
    void deleteByExpiresAtBefore(java.time.LocalDateTime cutoff);

    /** 같은 디바이스의 기존 토큰 일괄 정리 — issueTokens 가 새 토큰 발급 직전 호출. */
    void deleteByUserAndDeviceId(User user, String deviceId);
}
