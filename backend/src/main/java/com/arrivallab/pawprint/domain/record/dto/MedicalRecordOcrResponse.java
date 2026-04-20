package com.arrivallab.pawprint.domain.record.dto;

public record MedicalRecordOcrResponse(
        String hospitalName,
        String visitedAt,
        String symptoms,
        String diagnosis,
        String treatment,
        String prescription
) {
    public static MedicalRecordOcrResponse empty() {
        return new MedicalRecordOcrResponse(null, null, null, null, null, null);
    }
}
