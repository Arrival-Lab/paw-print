package com.arrivallab.pawprint.domain.user.repository;

import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import com.arrivallab.pawprint.domain.user.entity.Provider;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByProviderAndProviderId(Provider provider, String providerId);
    boolean existsByEmail(String email);
}
