package com.arrivallab.pawprint.domain.care.dto;

import com.arrivallab.pawprint.domain.care.entity.CareItemType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CareItemRequest(
        @NotBlank @Size(max = 60) String name,
        @NotNull CareItemType itemType,
        @Min(1) Integer targetCount,
        Integer sortOrder
) {
    public int targetCountOrDefault() { return targetCount != null ? targetCount : 1; }
    public int sortOrderOrDefault() { return sortOrder != null ? sortOrder : 0; }
}
