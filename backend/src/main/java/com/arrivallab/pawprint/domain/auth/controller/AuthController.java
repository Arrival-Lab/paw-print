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

    // X-Device-Id: 멀티 디바이스 토큰 분리용. 구버전 클라이언트는 미전송 → null (분리 미적용, 호환).
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @RequestBody @Valid GoogleLoginRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        return ApiResponse.ok(authService.googleLogin(request.idToken(), deviceId));
    }

    @PostMapping("/apple")
    public ResponseEntity<ApiResponse<AuthResponse>> appleLogin(
            @RequestBody @Valid AppleLoginRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String deviceId) {
        return ApiResponse.ok(authService.appleLogin(request.identityToken(), deviceId));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody @Valid RefreshTokenRequest request,
            @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId) {
        // body 의 deviceId 우선, 없으면 header. 둘 다 없으면 기존 토큰의 deviceId 보존.
        String deviceId = request.deviceId() != null ? request.deviceId() : headerDeviceId;
        return ApiResponse.ok(authService.refresh(request.refreshToken(), deviceId));
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
