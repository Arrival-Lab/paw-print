package com.arrivallab.pawprint.domain.record.controller;

import com.arrivallab.pawprint.domain.record.dto.*;
import com.arrivallab.pawprint.domain.record.service.MedicalRecordService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import com.arrivallab.pawprint.global.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/pets/{petId}/records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService recordService;

    @PostMapping
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestBody @Valid MedicalRecordRequest request) {
        return ApiResponse.created(recordService.create(uid(userDetails), petId, request));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MedicalRecordSummaryDto>>> getRecords(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(recordService.getRecords(uid(userDetails), petId, page, size, from, to));
    }

    @GetMapping("/{recordId}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getRecord(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long recordId) {
        return ApiResponse.ok(recordService.getRecord(uid(userDetails), petId, recordId));
    }

    @PutMapping("/{recordId}")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long recordId,
            @RequestBody @Valid MedicalRecordRequest request) {
        return ApiResponse.ok(recordService.update(uid(userDetails), petId, recordId, request));
    }

    @DeleteMapping("/{recordId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long recordId) {
        recordService.delete(uid(userDetails), petId, recordId);
        return ApiResponse.noContent();
    }

    /** 사용자가 이전에 입력한 병원명 (records + appointments 양쪽 union) — autocomplete 추천. */
    @GetMapping("/hospital-suggestions")
    public ResponseEntity<ApiResponse<java.util.List<String>>> getHospitalSuggestions(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        return ApiResponse.ok(recordService.getHospitalSuggestions(uid(userDetails), petId));
    }

    @PostMapping("/{recordId}/attachments")
    public ResponseEntity<ApiResponse<AttachmentResponse>> addAttachment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long recordId,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.created(recordService.addAttachment(uid(userDetails), petId, recordId, file));
    }

    @DeleteMapping("/{recordId}/attachments/{attachmentId}")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long recordId,
            @PathVariable Long attachmentId) {
        recordService.deleteAttachment(uid(userDetails), petId, recordId, attachmentId);
        return ApiResponse.noContent();
    }

    private Long uid(UserDetails u) {
        return Long.parseLong(u.getUsername());
    }
}
