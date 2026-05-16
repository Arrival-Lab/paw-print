package com.arrivallab.pawprint.domain.care.dto;

import java.util.List;

/** 홈 위젯용 — 펫별 오늘 진행률. */
public record HomeCareDto(
        Long petId,
        String petName,
        int totalTargets,    // 모든 항목의 targetCount 합
        int totalCompleted,  // 모든 항목의 min(count, targetCount) 합
        List<DailyCareDto> items
) {}
