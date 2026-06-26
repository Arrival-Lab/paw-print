package com.arrivallab.pawprint.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

/** IANA 타임존 id (예: Asia/Seoul, America/New_York). 유효성은 서비스에서 ZoneId.of 로 검증. */
public record TimezoneRequest(@NotBlank String timezone) {}
