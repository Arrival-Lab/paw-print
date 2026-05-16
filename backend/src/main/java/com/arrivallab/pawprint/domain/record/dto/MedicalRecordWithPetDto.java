package com.arrivallab.pawprint.domain.record.dto;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;

import java.time.LocalDate;

public record MedicalRecordWithPetDto(
        Long id,
        Long petId,
        String petName,
        LocalDate visitedAt,
        String hospitalName,
        String symptoms,
        int attachmentCount
) {
    public static MedicalRecordWithPetDto from(MedicalRecord record) {
        return new MedicalRecordWithPetDto(
                record.getId(),
                record.getPet().getId(),
                record.getPet().getName(),
                record.getVisitedAt(),
                record.getHospitalName(),
                record.getSymptoms(),
                record.getAttachments().size()
        );
    }
}
