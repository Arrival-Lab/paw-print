package com.arrivallab.pawprint.domain.appointment.repository;

import com.arrivallab.pawprint.domain.appointment.entity.Appointment;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /** 특정 펫의 예약 — 시각 오름차순. */
    List<Appointment> findByPet_IdOrderByAppointmentAtAsc(Long petId);

    /** 특정 펫의 특정 월 예약 (캘린더 마커용) — 날짜 범위. */
    @Query("""
        SELECT a FROM Appointment a
        WHERE a.pet.id = :petId
          AND a.appointmentAt >= :from
          AND a.appointmentAt < :to
        ORDER BY a.appointmentAt ASC
    """)
    List<Appointment> findByPetAndRange(@Param("petId") Long petId,
                                        @Param("from") LocalDateTime from,
                                        @Param("to") LocalDateTime to);

    /** 본인 + 공유받은(ACCEPTED) 펫의 다가오는 예약 — 홈/오늘 섹션용. */
    @Query("""
        SELECT a FROM Appointment a
        WHERE (a.pet.user.id = :userId
            OR a.pet.id IN (SELECT sm.pet.id FROM ShareMember sm
                            WHERE sm.member.id = :userId AND sm.status = :status))
          AND a.appointmentAt >= :from
          AND a.appointmentAt <= :until
        ORDER BY a.appointmentAt ASC
    """)
    List<Appointment> findUpcomingByUserId(@Param("userId") Long userId,
                                            @Param("status") ShareStatus status,
                                            @Param("from") LocalDateTime from,
                                            @Param("until") LocalDateTime until);
}
