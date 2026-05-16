package com.arrivallab.pawprint.domain.care.dto;

import com.arrivallab.pawprint.domain.care.entity.CareItemType;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record CareItemRequest(
        @NotBlank @Size(max = 60) String name,
        @NotNull CareItemType itemType,
        @Min(1) Integer targetCount,
        Integer sortOrder,
        @JsonFormat(pattern = "HH:mm") LocalTime reminderTime
) {
    public int targetCountOrDefault() { return targetCount != null ? targetCount : 1; }
    public int sortOrderOrDefault() { return sortOrder != null ? sortOrder : 0; }
}
