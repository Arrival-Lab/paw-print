package com.arrivallab.pawprint.domain.auth.controller;

import com.arrivallab.pawprint.domain.auth.dto.AuthResponse;
import com.arrivallab.pawprint.domain.auth.service.AuthService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * ⚠️ Dev 전용 엔드포인트 — 누구나 호출하면 PREMIUM/FREE 계정을 발급받을 수 있음.
 * 앱 dev 빌드와 prod 배포 백엔드를 같이 쓸 수 있도록 @Profile 제한을 풀어둔 상태.
 * 공개 출시 전에 반드시 이 컨트롤러 삭제 또는 @Profile("local")로 복구할 것.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
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
