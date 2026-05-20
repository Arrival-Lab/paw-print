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
        String notes,
        /** 진료일정에서 만들어진 기록이면 그 appointment id. 독립 기록이면 null. */
        Long appointmentId
) {}
