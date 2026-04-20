package com.arrivallab.pawprint.domain.diary.controller;

import com.arrivallab.pawprint.domain.diary.dto.MetricPointDto;
import com.arrivallab.pawprint.domain.diary.dto.MetricRequest;
import com.arrivallab.pawprint.domain.diary.dto.MetricResponse;
import com.arrivallab.pawprint.domain.diary.entity.MetricType;
import com.arrivallab.pawprint.domain.diary.service.MetricService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import com.arrivallab.pawprint.global.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pets/{petId}/metrics")
@RequiredArgsConstructor
public class MetricController {

    private final MetricService metricService;

    @PostMapping
    public ResponseEntity<ApiResponse<MetricResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @Valid @RequestBody MetricRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(metricService.create(userId, petId, request));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MetricResponse>>> getMetrics(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam(required = false) MetricType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(metricService.getMetrics(userId, petId, type, page, size));
    }

    @GetMapping("/chart")
    public ResponseEntity<ApiResponse<List<MetricPointDto>>> getChartData(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam MetricType type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(metricService.getChartData(userId, petId, type, from, to));
    }

    @DeleteMapping("/{metricId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long metricId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        metricService.delete(userId, petId, metricId);
        return ApiResponse.ok(null);
    }
}
