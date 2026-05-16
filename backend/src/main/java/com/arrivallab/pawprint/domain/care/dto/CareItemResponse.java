package com.arrivallab.pawprint.domain.care.dto;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import com.arrivallab.pawprint.domain.care.entity.CareItemType;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

public record CareItemResponse(
        Long id,
        String name,
        CareItemType itemType,
        int targetCount,
        int sortOrder,
        @JsonFormat(pattern = "HH:mm") LocalTime reminderTime
) {
    public static CareItemResponse from(CareItem item) {
        return new CareItemResponse(
                item.getId(),
                item.getName(),
                item.getItemType(),
                item.getTargetCount(),
                item.getSortOrder(),
                item.getReminderTime()
        );
    }
}
