package com.arrivallab.pawprint.domain.vaccine.controller;

import com.arrivallab.pawprint.domain.vaccine.dto.VaccineRequest;
import com.arrivallab.pawprint.domain.vaccine.dto.VaccineResponse;
import com.arrivallab.pawprint.domain.vaccine.entity.VaccineCategory;
import com.arrivallab.pawprint.domain.vaccine.service.VaccineService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pets/{petId}/vaccines")
@RequiredArgsConstructor
public class VaccineController {

    private final VaccineService vaccineService;

    @PostMapping
    public ResponseEntity<ApiResponse<VaccineResponse>> create(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @Valid @RequestBody VaccineRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(vaccineService.create(userId, petId, request));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VaccineResponse>>> getVaccines(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam(required = false) VaccineCategory category) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(vaccineService.getVaccines(userId, petId, category));
    }

    @PutMapping("/{vaccineId}")
    public ResponseEntity<ApiResponse<VaccineResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long vaccineId,
            @Valid @RequestBody VaccineRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(vaccineService.update(userId, petId, vaccineId, request));
    }

    @DeleteMapping("/{vaccineId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long vaccineId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        vaccineService.delete(userId, petId, vaccineId);
        return ApiResponse.ok(null);
    }
}
