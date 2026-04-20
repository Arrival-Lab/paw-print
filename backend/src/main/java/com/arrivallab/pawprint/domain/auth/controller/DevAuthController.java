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
}
