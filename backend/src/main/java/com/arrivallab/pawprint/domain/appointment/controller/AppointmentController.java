package com.arrivallab.pawprint.domain.appointment.controller;

import com.arrivallab.pawprint.domain.appointment.dto.AppointmentRequest;
import com.arrivallab.pawprint.domain.appointment.dto.AppointmentResponse;
import com.arrivallab.pawprint.domain.appointment.dto.AppointmentWithPetDto;
import com.arrivallab.pawprint.domain.appointment.service.AppointmentService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping("/api/pets/{petId}/appointments")
    public ResponseEntity<ApiResponse<AppointmentResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @Valid @RequestBody AppointmentRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(appointmentService.create(userId, petId, request));
    }

    @GetMapping("/api/pets/{petId}/appointments")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAll(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(appointmentService.getAll(userId, petId));
    }

    /** 다이어리 캘린더 마커용 — 특정 월의 예약. */
    @GetMapping("/api/pets/{petId}/appointments/month")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMonth(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam int year,
            @RequestParam int month) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(appointmentService.getMonth(userId, petId, year, month));
    }

    /** 홈 "다가오는 예약" — 본인+공유 펫 전부. */
    @GetMapping("/api/appointments/upcoming")
    public ResponseEntity<ApiResponse<List<AppointmentWithPetDto>>> getUpcoming(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "30") int withinDays) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(appointmentService.getUpcomingForUser(userId, withinDays));
    }

    @PutMapping("/api/pets/{petId}/appointments/{appointmentId}")
    public ResponseEntity<ApiResponse<AppointmentResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long appointmentId,
            @Valid @RequestBody AppointmentRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(appointmentService.update(userId, petId, appointmentId, request));
    }

    @DeleteMapping("/api/pets/{petId}/appointments/{appointmentId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long appointmentId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        appointmentService.delete(userId, petId, appointmentId);
        return ApiResponse.noContent();
    }
}
