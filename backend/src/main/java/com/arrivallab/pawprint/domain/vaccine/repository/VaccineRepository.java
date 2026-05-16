package com.arrivallab.pawprint.domain.vaccine.repository;

import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface VaccineRepository extends JpaRepository<Vaccine, Long> {

    List<Vaccine> findByPetIdOrderByNextVaccineAtAsc(Long petId);

    long countByPetIdAndAlertEnabledTrue(Long petId);

    @Query("SELECT v FROM Vaccine v JOIN FETCH v.pet p JOIN FETCH p.user u " +
           "WHERE v.alertEnabled = true AND v.nextVaccineAt = :date AND u.fcmToken IS NOT NULL")
    List<Vaccine> findAlertableByNextVaccineAt(@Param("date") LocalDate date);

    @Query("SELECT v FROM Vaccine v JOIN FETCH v.pet p WHERE " +
           "(p.user.id = :userId " +
           "  OR p.id IN (SELECT sm.pet.id FROM ShareMember sm " +
           "              WHERE sm.member.id = :userId AND sm.status = :status)) " +
           "AND v.nextVaccineAt IS NOT NULL " +
           "AND v.nextVaccineAt >= :today AND v.nextVaccineAt <= :until " +
           "ORDER BY v.nextVaccineAt ASC")
    List<Vaccine> findUpcomingByUserId(@Param("userId") Long userId,
                                       @Param("status") ShareStatus status,
                                       @Param("today") LocalDate today,
                                       @Param("until") LocalDate until);
}
