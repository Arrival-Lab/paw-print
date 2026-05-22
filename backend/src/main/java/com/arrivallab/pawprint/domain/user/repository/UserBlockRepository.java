package com.arrivallab.pawprint.domain.user.repository;

import com.arrivallab.pawprint.domain.user.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    Optional<UserBlock> findByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);

    boolean existsByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);

    List<UserBlock> findAllByBlocker_IdOrderByCreatedAtDesc(Long blockerId);

    @Query("SELECT ub.blocked.id FROM UserBlock ub WHERE ub.blocker.id = :blockerId")
    List<Long> findBlockedIdsByBlockerId(@Param("blockerId") Long blockerId);
}
