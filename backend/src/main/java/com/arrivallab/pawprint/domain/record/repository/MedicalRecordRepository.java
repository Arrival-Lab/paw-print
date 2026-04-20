package com.arrivallab.pawprint.domain.record.repository;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    @Query("SELECT r FROM MedicalRecord r WHERE r.pet.id = :petId " +
           "AND (:from IS NULL OR r.visitedAt >= :from) " +
           "AND (:to IS NULL OR r.visitedAt <= :to) " +
           "ORDER BY r.visitedAt DESC")
    Page<MedicalRecord> findByPetId(@Param("petId") Long petId,
                                    @Param("from") LocalDate from,
                                    @Param("to") LocalDate to,
                                    Pageable pageable);
}
