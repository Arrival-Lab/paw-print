package com.arrivallab.pawprint.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** deviceId 는 멀티 디바이스 토큰 분리 관리용 — 구버전 클라이언트 호환 위해 nullable. */
public record RefreshTokenRequest(@NotBlank String refreshToken, String deviceId) {}
