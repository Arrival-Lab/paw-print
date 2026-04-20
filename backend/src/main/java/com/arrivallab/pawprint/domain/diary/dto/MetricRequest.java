package com.arrivallab.pawprint.domain.diary.dto;

import com.arrivallab.pawprint.domain.diary.entity.MetricType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MetricRequest(
        @NotNull MetricType metricType,
        String metricName,
        @NotNull BigDecimal value,
        String unit,
        @NotNull LocalDate measuredAt
) {}
