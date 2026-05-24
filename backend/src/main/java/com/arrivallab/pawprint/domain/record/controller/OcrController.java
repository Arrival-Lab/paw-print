package com.arrivallab.pawprint.domain.record.controller;

import com.arrivallab.pawprint.domain.record.dto.MedicalRecordOcrResponse;
import com.arrivallab.pawprint.domain.record.service.OcrUsageService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class OcrController {

    private final OcrUsageService ocrUsageService;

    @PostMapping("/ocr")
    public ResponseEntity<ApiResponse<MedicalRecordOcrResponse>> parseOcr(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(ocrUsageService.parseImage(userId, file));
    }

    @PostMapping("/audio")
    public ResponseEntity<ApiResponse<MedicalRecordOcrResponse>> parseAudio(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(ocrUsageService.parseAudio(userId, file));
    }
}
