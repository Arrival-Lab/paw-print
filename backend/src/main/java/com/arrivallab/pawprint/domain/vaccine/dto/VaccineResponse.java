package com.arrivallab.pawprint.domain.vaccine.dto;

import com.arrivallab.pawprint.domain.vaccine.entity.RecurrenceType;
import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;

import java.time.LocalDate;

public record VaccineResponse(
        Long id,
        String vaccineName,
        LocalDate vaccinatedAt,
        LocalDate nextVaccineAt,
        String notes,
        Boolean alertEnabled,
        RecurrenceType recurrenceType,
        Integer dDay
) {
    public static VaccineResponse from(Vaccine v) {
        Integer dDay = null;
        if (v.getNextVaccineAt() != null) {
            dDay = (int) java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), v.getNextVaccineAt());
        }
        return new VaccineResponse(v.getId(), v.getVaccineName(), v.getVaccinatedAt(),
                v.getNextVaccineAt(), v.getNotes(), v.getAlertEnabled(),
                v.getRecurrenceType(), dDay);
    }
}
