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
        Integer remainingFreeChecks,
        /**
         * Apple Guideline 1.4.1 — 의학 정보 출처. 결과 화면 하단에 항상 노출.
         * 모든 응답 경로(정상/응급/폴백)에서 동일 리스트가 채워짐.
         */
        List<Reference> references
) {
    public enum Urgency { IMMEDIATE, WITHIN_24H, OBSERVE, UNCLEAR }

    public record PossibleCause(
            String name,
            /** 0~100 */
            int probability,
            String description,
            /**
             * MSD Veterinary Manual 검색 URL — 보호자가 해당 가능 원인에 대해 권위 있는 출처로 바로 이동.
             * Apple Guideline 1.4.1 대응: AI 가 출력한 모든 가능 원인에 citation link 보장.
             */
            String referenceUrl
    ) {}

    public record Reference(
            String name,
            String url
    ) {}
}
