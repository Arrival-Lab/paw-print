package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.PostTag;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PostRequest(
        @NotBlank String title,
        @NotBlank String content,
        @NotNull PostTag tag
) {}
