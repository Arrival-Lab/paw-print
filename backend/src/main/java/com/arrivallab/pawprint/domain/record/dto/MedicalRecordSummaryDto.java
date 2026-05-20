package com.arrivallab.pawprint.domain.record.dto;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;

import java.time.LocalDate;

public record MedicalRecordSummaryDto(
        Long id,
        LocalDate visitedAt,
        String hospitalName,
        String symptoms,
        Long appointmentId,
        int attachmentCount
) {
    public static MedicalRecordSummaryDto from(MedicalRecord record) {
        return new MedicalRecordSummaryDto(
                record.getId(),
                record.getVisitedAt(),
                record.getHospitalName(),
                record.getSymptoms(),
                record.getAppointmentId(),
                record.getAttachments().size()
        );
    }
}
