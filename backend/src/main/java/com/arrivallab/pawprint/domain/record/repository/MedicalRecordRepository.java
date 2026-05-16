package com.arrivallab.pawprint.domain.record.repository;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("SELECT r.visitedAt FROM MedicalRecord r WHERE r.pet.id = :petId " +
           "AND r.visitedAt BETWEEN :start AND :end")
    List<LocalDate> findVisitedDatesByPetIdAndRange(@Param("petId") Long petId,
                                                    @Param("start") LocalDate start,
                                                    @Param("end") LocalDate end);

    @Query("SELECT r FROM MedicalRecord r WHERE r.pet.id = :petId " +
           "AND (:from IS NULL OR r.visitedAt >= :from) " +
           "AND (:to IS NULL OR r.visitedAt <= :to) " +
           "ORDER BY r.visitedAt DESC")
    Page<MedicalRecord> findByPetId(@Param("petId") Long petId,
                                    @Param("from") LocalDate from,
                                    @Param("to") LocalDate to,
                                    Pageable pageable);

    @Query("SELECT r.visitedAt FROM MedicalRecord r JOIN r.pet p WHERE p.user.id = :userId " +
           "AND r.visitedAt BETWEEN :start AND :end")
    List<LocalDate> findVisitedDatesByUserAndRange(@Param("userId") Long userId,
                                                    @Param("start") LocalDate start,
                                                    @Param("end") LocalDate end);

    @Query(value = "SELECT r FROM MedicalRecord r JOIN FETCH r.pet p WHERE p.user.id = :userId " +
                   "ORDER BY r.visitedAt DESC",
           countQuery = "SELECT COUNT(r) FROM MedicalRecord r JOIN r.pet p WHERE p.user.id = :userId")
    Page<MedicalRecord> findByUserId(@Param("userId") Long userId, Pageable pageable);
}
