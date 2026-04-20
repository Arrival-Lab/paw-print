package com.arrivallab.pawprint.domain.subscription.controller;

import com.arrivallab.pawprint.domain.subscription.dto.PurchaseRequest;
import com.arrivallab.pawprint.domain.subscription.dto.SubscriptionStatusResponse;
import com.arrivallab.pawprint.domain.subscription.service.SubscriptionService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> purchase(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PurchaseRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(subscriptionService.purchase(userId, request));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> restore(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PurchaseRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(subscriptionService.restore(userId, request));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(subscriptionService.getStatus(userId));
    }
}
