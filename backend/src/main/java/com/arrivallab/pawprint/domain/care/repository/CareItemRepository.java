package com.arrivallab.pawprint.domain.care.repository;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface CareItemRepository extends JpaRepository<CareItem, Long> {
    List<CareItem> findByPet_IdAndActiveTrueOrderBySortOrderAscIdAsc(Long petId);
    long countByPet_IdAndActiveTrue(Long petId);

    /** 알림 스케줄러용 — 활성 + reminderTime 이 [from, to) 범위 (분 단위 윈도우). */
    @Query("SELECT ci FROM CareItem ci JOIN FETCH ci.pet p JOIN FETCH p.user " +
           "WHERE ci.active = true " +
           "AND ci.reminderTime IS NOT NULL " +
           "AND ci.reminderTime >= :from AND ci.reminderTime < :to")
    List<CareItem> findActiveByReminderWindow(@Param("from") LocalTime from, @Param("to") LocalTime to);
}
