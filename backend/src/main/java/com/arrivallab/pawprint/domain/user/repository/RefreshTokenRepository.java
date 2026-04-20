package com.arrivallab.pawprint.domain.user.repository;

import com.arrivallab.pawprint.domain.user.entity.RefreshToken;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    void deleteByRotatedAtBefore(java.time.LocalDateTime cutoff);
}
