package com.arrivallab.pawprint.domain.symptom.controller;

import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckRequest;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckResponse;
import com.arrivallab.pawprint.domain.symptom.service.SymptomCheckService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class SymptomCheckController {

    private final SymptomCheckService service;

    @PostMapping("/symptom-check")
    public ResponseEntity<ApiResponse<SymptomCheckResponse>> check(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SymptomCheckRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(service.check(userId, request));
    }
}
