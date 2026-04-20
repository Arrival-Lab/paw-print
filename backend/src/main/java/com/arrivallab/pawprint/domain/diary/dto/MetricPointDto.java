package com.arrivallab.pawprint.domain.diary.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MetricPointDto(LocalDate measuredAt, BigDecimal value) {}
