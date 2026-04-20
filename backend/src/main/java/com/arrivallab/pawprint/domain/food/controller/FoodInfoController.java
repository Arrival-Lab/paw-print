package com.arrivallab.pawprint.domain.food.controller;

import com.arrivallab.pawprint.domain.food.dto.FoodInfoRequest;
import com.arrivallab.pawprint.domain.food.dto.FoodInfoResponse;
import com.arrivallab.pawprint.domain.food.service.FoodInfoService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pets/{petId}/food")
@RequiredArgsConstructor
public class FoodInfoController {

    private final FoodInfoService foodInfoService;

    @GetMapping
    public ResponseEntity<ApiResponse<FoodInfoResponse>> get(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(foodInfoService.get(userId, petId));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<FoodInfoResponse>> upsert(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestBody FoodInfoRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(foodInfoService.upsert(userId, petId, request));
    }
}
