package com.arrivallab.pawprint.domain.record.controller;

import com.arrivallab.pawprint.domain.record.dto.MedicalRecordWithPetDto;
import com.arrivallab.pawprint.domain.record.service.MedicalRecordService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import com.arrivallab.pawprint.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 현재 유저의 모든 펫 진료기록을 한 번에 페이지네이션 — 프론트 "전체" 보기용. */
@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class MedicalRecordAggregateController {

    private final MedicalRecordService recordService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<MedicalRecordWithPetDto>>> getAllRecords(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(recordService.getAllRecordsForUser(userId, page, size));
    }
}
