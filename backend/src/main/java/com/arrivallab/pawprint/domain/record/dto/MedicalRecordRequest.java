package com.arrivallab.pawprint.domain.record.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MedicalRecordRequest(
        @NotNull LocalDate visitedAt,
        String hospitalName,
        String symptoms,
        String diagnosis,
        String treatment,
        String prescription,
        String notes
) {}
