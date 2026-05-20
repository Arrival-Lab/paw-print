package com.arrivallab.pawprint.domain.record.repository;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
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

    @Query("SELECT r.visitedAt FROM MedicalRecord r WHERE " +
           "(r.pet.user.id = :userId " +
           "  OR r.pet.id IN (SELECT sm.pet.id FROM ShareMember sm " +
           "                  WHERE sm.member.id = :userId AND sm.status = :status)) " +
           "AND r.visitedAt BETWEEN :start AND :end")
    List<LocalDate> findVisitedDatesByUserAndRange(@Param("userId") Long userId,
                                                    @Param("status") ShareStatus status,
                                                    @Param("start") LocalDate start,
                                                    @Param("end") LocalDate end);

    @Query(value = "SELECT r FROM MedicalRecord r JOIN FETCH r.pet p WHERE " +
                   "p.user.id = :userId " +
                   "  OR p.id IN (SELECT sm.pet.id FROM ShareMember sm " +
                   "              WHERE sm.member.id = :userId AND sm.status = :status) " +
                   "ORDER BY r.visitedAt DESC",
           countQuery = "SELECT COUNT(r) FROM MedicalRecord r WHERE " +
                        "r.pet.user.id = :userId " +
                        "  OR r.pet.id IN (SELECT sm.pet.id FROM ShareMember sm " +
                        "                  WHERE sm.member.id = :userId AND sm.status = :status)")
    Page<MedicalRecord> findByUserId(@Param("userId") Long userId,
                                     @Param("status") ShareStatus status,
                                     Pageable pageable);

    /** appointmentId 로 연결된 기록 찾기 — 진료일정 상세에서 "이미 기록 작성됨" 표시용. */
    java.util.Optional<MedicalRecord> findByPet_IdAndAppointmentId(Long petId, Long appointmentId);

    /** 펫의 진료기록에서 사용된 distinct hospital names — autocomplete 용. */
    @Query("SELECT DISTINCT r.hospitalName FROM MedicalRecord r " +
           "WHERE r.pet.id = :petId AND r.hospitalName IS NOT NULL AND r.hospitalName <> '' " +
           "ORDER BY r.hospitalName")
    List<String> findDistinctHospitalNamesByPetId(@Param("petId") Long petId);
}
