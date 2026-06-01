package com.arrivallab.pawprint.domain.user.controller;

import com.arrivallab.pawprint.domain.auth.dto.UserResponse;
import com.arrivallab.pawprint.domain.user.dto.NicknameRequest;
import com.arrivallab.pawprint.domain.user.dto.NotificationPreferencesDto;
import com.arrivallab.pawprint.domain.user.service.UserService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/me/nickname")
    public ResponseEntity<ApiResponse<UserResponse>> updateNickname(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid NicknameRequest request
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(userService.updateNickname(userId, request.nickname()));
    }

    @GetMapping("/me/nickname/available")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> checkAvailability(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String nickname
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        boolean available = userService.isNicknameAvailable(userId, nickname);
        return ApiResponse.ok(Map.of("available", available));
    }

    @GetMapping("/me/notification-preferences")
    public ResponseEntity<ApiResponse<NotificationPreferencesDto>> getNotificationPreferences(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(userService.getNotificationPreferences(userId));
    }

    @PatchMapping("/me/notification-preferences")
    public ResponseEntity<ApiResponse<NotificationPreferencesDto>> updateNotificationPreferences(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody NotificationPreferencesDto request
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(userService.updateNotificationPreferences(userId, request));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMyAccount(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        userService.deleteMyAccount(userId);
        return ApiResponse.noContent();
    }
}
