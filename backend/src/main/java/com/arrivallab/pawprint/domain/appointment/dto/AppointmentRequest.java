package com.arrivallab.pawprint.domain.appointment.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentRequest(
        @NotNull LocalDateTime appointmentAt,
        String hospitalName,
        String reason,
        String notes,
        Boolean reminderEnabled
) {}
