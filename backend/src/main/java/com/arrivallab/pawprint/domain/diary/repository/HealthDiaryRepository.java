package com.arrivallab.pawprint.domain.diary.repository;

import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;
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

    @Query("SELECT d FROM HealthDiary d WHERE d.pet.id = :petId " +
           "AND (:from IS NULL OR d.diaryDate >= :from) " +
           "AND (:to IS NULL OR d.diaryDate <= :to) " +
           "ORDER BY d.diaryDate DESC")
    Page<HealthDiary> findByPetId(@Param("petId") Long petId,
                                  @Param("from") LocalDate from,
                                  @Param("to") LocalDate to,
                                  Pageable pageable);

    @Query("SELECT d FROM HealthDiary d WHERE d.pet.id = :petId " +
           "AND d.diaryDate BETWEEN :start AND :end")
    List<HealthDiary> findForCalendar(@Param("petId") Long petId,
                                      @Param("start") LocalDate start,
                                      @Param("end") LocalDate end);

    @Query("SELECT d FROM HealthDiary d JOIN d.pet p WHERE p.user.id = :userId " +
           "AND d.diaryDate BETWEEN :start AND :end")
    List<HealthDiary> findForUserCalendar(@Param("userId") Long userId,
                                          @Param("start") LocalDate start,
                                          @Param("end") LocalDate end);

    @Query("SELECT DISTINCT d FROM HealthDiary d LEFT JOIN d.tags t WHERE d.pet.id = :petId " +
           "AND (:keyword IS NULL OR d.content LIKE CONCAT('%', :keyword, '%')) " +
           "AND (:hasTagFilter = false OR t.tagName IN :tags) " +
           "ORDER BY d.diaryDate DESC")
    Page<HealthDiary> search(@Param("petId") Long petId,
                              @Param("keyword") String keyword,
                              @Param("tags") List<String> tags,
                              @Param("hasTagFilter") boolean hasTagFilter,
                              Pageable pageable);
}
