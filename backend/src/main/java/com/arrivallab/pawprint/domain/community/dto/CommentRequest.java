package com.arrivallab.pawprint.domain.community.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentRequest(@NotBlank String content) {}
