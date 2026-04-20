package com.arrivallab.pawprint.domain.diary.repository;

import com.arrivallab.pawprint.domain.diary.entity.HealthMetric;
import com.arrivallab.pawprint.domain.diary.entity.MetricType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface HealthMetricRepository extends JpaRepository<HealthMetric, Long> {

    @Query("SELECT m FROM HealthMetric m WHERE m.pet.id = :petId " +
           "AND (:type IS NULL OR m.metricType = :type) " +
           "ORDER BY m.measuredAt DESC")
    Page<HealthMetric> findByPetId(@Param("petId") Long petId,
                                    @Param("type") MetricType type,
                                    Pageable pageable);

    @Query("SELECT m FROM HealthMetric m WHERE m.pet.id = :petId " +
           "AND m.metricType = :type " +
           "AND m.measuredAt BETWEEN :from AND :to " +
           "ORDER BY m.measuredAt ASC")
    List<HealthMetric> findForChart(@Param("petId") Long petId,
                                    @Param("type") MetricType type,
                                    @Param("from") LocalDate from,
                                    @Param("to") LocalDate to);
}
