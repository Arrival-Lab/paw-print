package com.arrivallab.pawprint.domain.diary.dto;

import com.arrivallab.pawprint.domain.diary.entity.HealthMetric;
import com.arrivallab.pawprint.domain.diary.entity.MetricType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MetricResponse(
        Long id,
        MetricType metricType,
        String metricName,
        BigDecimal value,
        String unit,
        LocalDate measuredAt
) {
    public static MetricResponse from(HealthMetric m) {
        return new MetricResponse(m.getId(), m.getMetricType(), m.getMetricName(),
                m.getValue(), m.getUnit(), m.getMeasuredAt());
    }
}
