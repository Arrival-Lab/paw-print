package com.arrivallab.pawprint.domain.record.dto;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;

import java.time.LocalDate;
import java.util.List;

public record MedicalRecordResponse(
        Long id,
        LocalDate visitedAt,
        String hospitalName,
        String symptoms,
        String diagnosis,
        String treatment,
        String prescription,
        String notes,
        Long appointmentId,
        List<AttachmentResponse> attachments
) {
    public static MedicalRecordResponse from(MedicalRecord record) {
        return new MedicalRecordResponse(
                record.getId(),
                record.getVisitedAt(),
                record.getHospitalName(),
                record.getSymptoms(),
                record.getDiagnosis(),
                record.getTreatment(),
                record.getPrescription(),
                record.getNotes(),
                record.getAppointmentId(),
                record.getAttachments().stream().map(AttachmentResponse::from).toList()
        );
    }
}
