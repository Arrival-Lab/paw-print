package com.arrivallab.pawprint.domain.care.dto;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import com.arrivallab.pawprint.domain.care.entity.CareItemType;

import java.time.LocalDate;

/** 항목 + 해당 날짜의 체크 count. */
public record DailyCareDto(
        Long itemId,
        String name,
        CareItemType itemType,
        int targetCount,
        int sortOrder,
        int count,
        Long checkId,
        LocalDate date
) {
    public static DailyCareDto of(CareItem item, int count, Long checkId, LocalDate date) {
        return new DailyCareDto(
                item.getId(),
                item.getName(),
                item.getItemType(),
                item.getTargetCount(),
                item.getSortOrder(),
                count,
                checkId,
                date
        );
    }
}
