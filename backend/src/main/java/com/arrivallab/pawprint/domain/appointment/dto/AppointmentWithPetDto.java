package com.arrivallab.pawprint.domain.appointment.dto;

import com.arrivallab.pawprint.domain.appointment.entity.Appointment;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/** 홈 "오늘"/"다가오는" 위젯용 — pet 정보 포함 + D-Day 계산 결과. */
public record AppointmentWithPetDto(
        Long id,
        Long petId,
        String petName,
        LocalDateTime appointmentAt,
        String hospitalName,
        String reason,
        Boolean reminderEnabled,
        Long dDay
) {
    public static AppointmentWithPetDto from(Appointment a) {
        long days = ChronoUnit.DAYS.between(
                java.time.LocalDate.now(),
                a.getAppointmentAt().toLocalDate());
        return new AppointmentWithPetDto(
                a.getId(),
                a.getPet().getId(),
                a.getPet().getName(),
                a.getAppointmentAt(),
                a.getHospitalName(),
                a.getReason(),
                a.getReminderEnabled(),
                days
        );
    }
}
