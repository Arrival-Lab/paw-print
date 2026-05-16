package com.arrivallab.pawprint.domain.diary.repository;

import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HealthDiaryRepository extends JpaRepository<HealthDiary, Long> {

    Optional<HealthDiary> findByPet_IdAndDiaryDate(Long petId, LocalDate diaryDate);

    Page<HealthDiary> findByPet_IdAndDiaryDateBetweenOrderByDiaryDateDesc(
            Long petId, LocalDate from, LocalDate to, Pageable pageable);

    @Query("SELECT d FROM HealthDiary d WHERE d.pet.id = :petId " +
           "AND d.diaryDate BETWEEN :start AND :end")
    List<HealthDiary> findForCalendar(@Param("petId") Long petId,
                                      @Param("start") LocalDate start,
                                      @Param("end") LocalDate end);

    @Query("SELECT d FROM HealthDiary d WHERE " +
           "(d.pet.user.id = :userId " +
           "  OR d.pet.id IN (SELECT sm.pet.id FROM ShareMember sm " +
           "                  WHERE sm.member.id = :userId AND sm.status = :status)) " +
           "AND d.diaryDate BETWEEN :start AND :end")
    List<HealthDiary> findForUserCalendar(@Param("userId") Long userId,
                                          @Param("status") ShareStatus status,
                                          @Param("start") LocalDate start,
                                          @Param("end") LocalDate end);

    /** "N년 전 오늘" — 본인 펫 + 공유 받은 펫의 같은 month-day, 오늘 이전 다이어리. 최근 연도 우선. */
    @Query("SELECT d FROM HealthDiary d WHERE " +
           "(d.pet.user.id = :userId " +
           "  OR d.pet.id IN (SELECT sm.pet.id FROM ShareMember sm " +
           "                  WHERE sm.member.id = :userId AND sm.status = :status)) " +
           "AND EXTRACT(MONTH FROM d.diaryDate) = :month " +
           "AND EXTRACT(DAY FROM d.diaryDate) = :day " +
           "AND d.diaryDate < :today " +
           "ORDER BY d.diaryDate DESC")
    List<HealthDiary> findMemoriesForUser(@Param("userId") Long userId,
                                          @Param("status") ShareStatus status,
                                          @Param("month") int month,
                                          @Param("day") int day,
                                          @Param("today") LocalDate today);

    @Query("SELECT DISTINCT d FROM HealthDiary d LEFT JOIN d.tags t WHERE d.pet.id = :petId " +
           "AND (:hasKeyword = false OR d.content LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:hasTagFilter = false OR t.tagName IN :tags) " +
           "ORDER BY d.diaryDate DESC")
    Page<HealthDiary> search(@Param("petId") Long petId,
                              @Param("keyword") String keyword,
                              @Param("hasKeyword") boolean hasKeyword,
                              @Param("tags") List<String> tags,
                              @Param("hasTagFilter") boolean hasTagFilter,
                              Pageable pageable);
}
