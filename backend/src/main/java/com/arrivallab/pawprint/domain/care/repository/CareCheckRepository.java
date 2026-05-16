package com.arrivallab.pawprint.domain.care.repository;

import com.arrivallab.pawprint.domain.care.entity.CareCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CareCheckRepository extends JpaRepository<CareCheck, Long> {
    Optional<CareCheck> findByCareItem_IdAndCheckedAt(Long careItemId, LocalDate checkedAt);

    /** 펫의 특정 날짜 모든 체크 (item 동시 fetch). */
    @Query("SELECT c FROM CareCheck c JOIN FETCH c.careItem ci " +
           "WHERE ci.pet.id = :petId AND c.checkedAt = :date")
    List<CareCheck> findByPetAndDate(@Param("petId") Long petId, @Param("date") LocalDate date);

    /** 펫의 기간 내 체크 — 주간 진행률 히트맵용. */
    @Query("SELECT c FROM CareCheck c JOIN FETCH c.careItem ci " +
           "WHERE ci.pet.id = :petId AND c.checkedAt BETWEEN :from AND :to")
    List<CareCheck> findByPetAndRange(@Param("petId") Long petId,
                                       @Param("from") LocalDate from,
                                       @Param("to") LocalDate to);

    /** 현재 유저(본인+공유)의 특정 날짜 체크 — 홈 위젯용. */
    @Query("SELECT c FROM CareCheck c JOIN FETCH c.careItem ci JOIN FETCH ci.pet p " +
           "WHERE c.checkedAt = :date " +
           "AND (p.user.id = :userId " +
           "  OR p.id IN (SELECT sm.pet.id FROM ShareMember sm " +
           "              WHERE sm.member.id = :userId AND sm.status = com.arrivallab.pawprint.domain.share.entity.ShareStatus.ACCEPTED))")
    List<CareCheck> findByUserAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);
}
