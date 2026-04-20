package com.arrivallab.pawprint.domain.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}
