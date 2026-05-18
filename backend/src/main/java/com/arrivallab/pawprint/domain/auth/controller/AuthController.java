package com.arrivallab.pawprint.domain.auth.controller;

import com.arrivallab.pawprint.domain.auth.dto.*;
import com.arrivallab.pawprint.domain.auth.service.AuthService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @RequestBody @Valid GoogleLoginRequest request) {
        return ApiResponse.ok(authService.googleLogin(request.idToken()));
    }

    @PostMapping("/apple")
    public ResponseEntity<ApiResponse<AuthResponse>> appleLogin(
            @RequestBody @Valid AppleLoginRequest request) {
        return ApiResponse.ok(authService.appleLogin(request.identityToken()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody @Valid RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refresh(request.refreshToken()));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.logout(Long.parseLong(userDetails.getUsername()));
        return ApiResponse.noContent();
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.ok(authService.me(Long.parseLong(userDetails.getUsername())));
    }

    @PatchMapping("/fcm-token")
    public ResponseEntity<ApiResponse<Void>> updateFcmToken(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody @Valid FcmTokenRequest request) {
        Long userId = Long.parseLong(userDetails.getUsername());
        String token = request.fcmToken();
        String preview = token != null && token.length() > 16 ? token.substring(0, 16) + "..." : token;
        log.info("FCM token update request: userId={} tokenLen={} tokenPreview={}",
                userId, token == null ? 0 : token.length(), preview);
        authService.updateFcmToken(userId, token);
        return ApiResponse.noContent();
    }
}
