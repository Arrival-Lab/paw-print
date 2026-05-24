package com.arrivallab.pawprint.domain.record.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MedicalRecordRequest(
        @NotNull LocalDate visitedAt,
        @Size(max = 120) String hospitalName,
        @Size(max = 2000) String symptoms,
        @Size(max = 2000) String diagnosis,
        @Size(max = 2000) String treatment,
        @Size(max = 2000) String prescription,
        @Size(max = 4000) String notes,
        /** 진료일정에서 만들어진 기록이면 그 appointment id. 독립 기록이면 null. */
        Long appointmentId
) {}
