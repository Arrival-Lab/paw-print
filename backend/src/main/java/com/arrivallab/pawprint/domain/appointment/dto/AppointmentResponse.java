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
        Boolean reminderEnabled
) {
    public static AppointmentResponse from(Appointment a) {
        return new AppointmentResponse(
                a.getId(),
                a.getPet().getId(),
                a.getAppointmentAt(),
                a.getHospitalName(),
                a.getReason(),
                a.getNotes(),
                a.getReminderEnabled()
        );
    }
}
