package com.arrivallab.pawprint.domain.auth.controller;

import com.arrivallab.pawprint.domain.auth.dto.AuthResponse;
import com.arrivallab.pawprint.domain.auth.service.AuthService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dev 전용 엔드포인트 — local profile 에서만 활성화. prod 배포 시 빈 등록 안 됨 → 404.
 * 누구나 호출하면 PREMIUM/FREE 계정을 발급받을 수 있어서 prod 노출 금지.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Profile("local")
public class DevAuthController {

    private final AuthService authService;

    @PostMapping("/dev-login")
    public ResponseEntity<ApiResponse<AuthResponse>> devLogin() {
        return ApiResponse.ok(authService.devLogin());
    }

    @PostMapping("/dev-login-free")
    public ResponseEntity<ApiResponse<AuthResponse>> devLoginFree() {
        return ApiResponse.ok(authService.devLoginFree());
    }
}
