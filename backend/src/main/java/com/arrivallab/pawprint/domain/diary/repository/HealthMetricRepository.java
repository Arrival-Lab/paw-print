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

    /**
     * '(:type IS NULL OR ...)' 패턴은 Postgres 42P18 던지므로 boolean flag 로 분기.
     * type 자리에는 항상 non-null enum 넘기되, typeFilter=false 면 평가 안 됨.
     */
    @Query("SELECT m FROM HealthMetric m WHERE m.pet.id = :petId " +
           "AND (:typeFilter = false OR m.metricType = :type) " +
           "ORDER BY m.measuredAt DESC")
    Page<HealthMetric> findByPetId(@Param("petId") Long petId,
                                    @Param("type") MetricType type,
                                    @Param("typeFilter") boolean typeFilter,
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
