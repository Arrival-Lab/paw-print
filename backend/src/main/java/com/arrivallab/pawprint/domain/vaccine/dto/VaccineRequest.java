package com.arrivallab.pawprint.domain.vaccine.dto;

import com.arrivallab.pawprint.domain.vaccine.entity.RecurrenceType;
import com.arrivallab.pawprint.domain.vaccine.entity.VaccineCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record VaccineRequest(
        @NotBlank String vaccineName,
        @NotNull LocalDate vaccinatedAt,
        LocalDate nextVaccineAt,
        String notes,
        Boolean alertEnabled,
        RecurrenceType recurrenceType,
        // 미지정 시 VACCINE. 정기체크 항목은 RECURRING.
        VaccineCategory category
) {}
