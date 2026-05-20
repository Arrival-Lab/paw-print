package com.arrivallab.pawprint.domain.appointment.dto;

import com.arrivallab.pawprint.domain.appointment.entity.Appointment;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long petId,
        LocalDateTime appointmentAt,
        String hospitalName,
        String reason,
        String notes,
        Boolean reminderEnabled,
        /** 이 예약과 연결된 진료기록 id. 아직 작성 안 됐으면 null. */
        Long linkedRecordId
) {
    public static AppointmentResponse from(Appointment a) {
        return from(a, null);
    }

    public static AppointmentResponse from(Appointment a, Long linkedRecordId) {
        return new AppointmentResponse(
                a.getId(),
                a.getPet().getId(),
                a.getAppointmentAt(),
                a.getHospitalName(),
                a.getReason(),
                a.getNotes(),
                a.getReminderEnabled(),
                linkedRecordId
        );
    }
}
