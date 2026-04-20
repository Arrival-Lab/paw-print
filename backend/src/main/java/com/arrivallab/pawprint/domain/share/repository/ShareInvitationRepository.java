package com.arrivallab.pawprint.domain.share.repository;

import com.arrivallab.pawprint.domain.share.entity.ShareInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShareInvitationRepository extends JpaRepository<ShareInvitation, Long> {
    Optional<ShareInvitation> findByToken(String token);
}
