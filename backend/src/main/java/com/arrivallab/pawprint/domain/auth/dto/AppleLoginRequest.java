package com.arrivallab.pawprint.domain.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record AppleLoginRequest(@NotBlank String identityToken) {}
