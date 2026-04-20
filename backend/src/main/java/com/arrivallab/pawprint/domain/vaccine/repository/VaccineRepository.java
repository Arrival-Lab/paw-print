package com.arrivallab.pawprint.domain.vaccine.repository;

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
}
