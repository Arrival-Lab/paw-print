package com.arrivallab.pawprint.domain.share.repository;

import com.arrivallab.pawprint.domain.share.entity.ShareInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ShareInvitationRepository extends JpaRepository<ShareInvitation, Long> {
    Optional<ShareInvitation> findByToken(String token);

    /** 코드 조회 시 만료/충돌 안전을 위해 활성 만료 시각 비교까지 한 번에. */
    @Query("""
        SELECT i FROM ShareInvitation i
        WHERE i.inviteCode = :code AND i.expiresAt > :now
    """)
    Optional<ShareInvitation> findActiveByCode(@Param("code") String code,
                                                @Param("now") LocalDateTime now);

    /** 코드 생성 시 충돌 검사 — 활성(만료 안 됨)인 코드만 unique. */
    @Query("""
        SELECT COUNT(i) > 0 FROM ShareInvitation i
        WHERE i.inviteCode = :code AND i.expiresAt > :now
    """)
    boolean existsActiveByCode(@Param("code") String code,
                                @Param("now") LocalDateTime now);
}
