package com.arrivallab.pawprint.domain.vaccine.dto;

import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record VaccineWithPetDto(
        Long id,
        Long petId,
        String petName,
        String vaccineName,
        LocalDate vaccinatedAt,
        LocalDate nextVaccineAt,
        String notes,
        Boolean alertEnabled,
        Integer dDay
) {
    public static VaccineWithPetDto from(Vaccine v) {
        Integer dDay = v.getNextVaccineAt() == null
                ? null
                : (int) ChronoUnit.DAYS.between(LocalDate.now(), v.getNextVaccineAt());
        return new VaccineWithPetDto(
                v.getId(),
                v.getPet().getId(),
                v.getPet().getName(),
                v.getVaccineName(),
                v.getVaccinatedAt(),
                v.getNextVaccineAt(),
                v.getNotes(),
                v.getAlertEnabled(),
                dDay
        );
    }
}
