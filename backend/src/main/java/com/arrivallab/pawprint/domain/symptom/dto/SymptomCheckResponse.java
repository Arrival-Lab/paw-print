package com.arrivallab.pawprint.domain.symptom.dto;

import java.util.List;

public record SymptomCheckResponse(
        Urgency urgency,
        String urgencyReason,
        List<PossibleCause> possibleCauses,
        List<String> recommendedActions,
        /** 응급 키워드가 입력에서 감지되어 즉시 응급 라우팅된 경우 키워드. */
        String emergencyKeywordDetected,
        String disclaimer,
        /** 무료 사용자에게 남은 횟수 표시용 (음수면 무제한). */
        Integer remainingFreeChecks
) {
    public enum Urgency { IMMEDIATE, WITHIN_24H, OBSERVE, UNCLEAR }

    public record PossibleCause(
            String name,
            /** 0~100 */
            int probability,
            String description
    ) {}
}
