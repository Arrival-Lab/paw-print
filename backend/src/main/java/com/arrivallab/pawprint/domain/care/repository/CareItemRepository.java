package com.arrivallab.pawprint.domain.care.repository;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface CareItemRepository extends JpaRepository<CareItem, Long> {

    /**
     * 특정 날짜에 활성인 케어 아이템 — discontinuedFrom 이 null 또는 그 날짜보다 미래.
     * 오늘 기준으로 호출하면 listItems/getHomeToday, 과거 날짜로 호출하면 그날의 실제 활성 목록.
     */
    @Query("SELECT i FROM CareItem i WHERE i.pet.id = :petId " +
           "AND (i.discontinuedFrom IS NULL OR i.discontinuedFrom > :date) " +
           "ORDER BY i.sortOrder ASC, i.id ASC")
    List<CareItem> findActiveOnDate(@Param("petId") Long petId, @Param("date") LocalDate date);

    /** 알림 스케줄러용 — 오늘 활성 + reminderTime 이 [from, to) 범위 (분 단위 윈도우). */
    @Query("SELECT ci FROM CareItem ci JOIN FETCH ci.pet p JOIN FETCH p.user " +
           "WHERE (ci.discontinuedFrom IS NULL OR ci.discontinuedFrom > :today) " +
           "AND ci.reminderTime IS NOT NULL " +
           "AND ci.reminderTime >= :from AND ci.reminderTime < :to")
    List<CareItem> findActiveByReminderWindow(@Param("today") LocalDate today,
                                              @Param("from") LocalTime from,
                                              @Param("to") LocalTime to);
}
