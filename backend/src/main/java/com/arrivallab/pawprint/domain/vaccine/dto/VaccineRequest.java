package com.arrivallab.pawprint.domain.vaccine.dto;

import com.arrivallab.pawprint.domain.vaccine.entity.RecurrenceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record VaccineRequest(
        @NotBlank String vaccineName,
        @NotNull LocalDate vaccinatedAt,
        LocalDate nextVaccineAt,
        String notes,
        Boolean alertEnabled,
        RecurrenceType recurrenceType
) {}
