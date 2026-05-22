package com.arrivallab.pawprint.domain.symptom.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * AI 증상 체크 follow-up (챗봇 후속 질문).
 *
 * 클라이언트가 초기 체크 컨텍스트와 대화 히스토리를 함께 보내면
 * 그 흐름을 이어받아 추가 답변을 만든다. 서버는 세션 상태를 저장하지 않음.
 *
 * @param petId 초기 체크에서 사용한 펫 ID (선택)
 * @param originalSymptoms 초기 체크 때 입력한 증상 — 컨텍스트 재구성용
 * @param originalDurationHours 초기 체크 때 입력한 지속 시간 (선택)
 * @param history 지금까지 주고받은 대화 turn (오래된 순서)
 * @param question 보호자가 새로 한 질문
 */
public record SymptomFollowupRequest(
        Long petId,
        @NotBlank(message = "초기 증상 컨텍스트가 필요해요")
        @Size(max = 1000)
        String originalSymptoms,
        Integer originalDurationHours,
        @Valid
        List<Turn> history,
        @NotBlank(message = "질문을 입력해주세요")
        @Size(max = 500, message = "질문은 500자 이내로 적어주세요")
        String question
) {
    public record Turn(
            @NotNull Role role,
            @NotBlank @Size(max = 2000) String content
    ) {
        public enum Role { USER, ASSISTANT }
    }
}
