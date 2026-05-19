package com.arrivallab.pawprint.domain.user.dto;

import jakarta.validation.constraints.NotBlank;

public record NicknameRequest(@NotBlank String nickname) {}
