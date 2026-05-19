package com.arrivallab.pawprint.domain.user.repository;

import com.arrivallab.pawprint.domain.user.entity.Provider;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByProviderAndProviderId(Provider provider, String providerId);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    @Query("SELECT u FROM User u WHERE u.subscriptionType = :type AND u.subscriptionExpiresAt < :now")
    List<User> findExpiredBySubscriptionType(@Param("type") SubscriptionType type,
                                              @Param("now") LocalDateTime now);
}
