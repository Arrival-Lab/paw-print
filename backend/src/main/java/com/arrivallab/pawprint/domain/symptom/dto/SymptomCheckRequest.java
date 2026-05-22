package com.arrivallab.pawprint.domain.symptom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * AI 증상 체크 입력.
 *
 * @param petId 펫 ID (선택) — 종/나이를 컨텍스트로 제공하면 더 맞춤 응답
 * @param symptoms 보호자가 관찰한 증상 자유 텍스트
 * @param durationHours 증상이 지속된 시간 (시간 단위, 선택)
 * @param additionalInfo 추가 컨텍스트 — 식이·환경 변화 등 (선택)
 * @param acknowledgedDisclaimer "수의사 진단이 아님" 면책에 동의 — true 가 아니면 거부
 */
public record SymptomCheckRequest(
        Long petId,
        @NotBlank(message = "증상을 입력해주세요")
        @Size(max = 1000, message = "증상은 1000자 이내로 적어주세요")
        String symptoms,
        Integer durationHours,
        @Size(max = 500)
        String additionalInfo,
        boolean acknowledgedDisclaimer
) {}
