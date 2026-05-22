package com.arrivallab.pawprint.domain.symptom.dto;

/**
 * AI 증상 체크 follow-up 응답.
 *
 * 초기 체크처럼 구조화된 카드가 아니라 짧은 텍스트 답변. 응급 키워드가 새로
 * 등장하면 emergencyKeywordDetected 채워서 프론트에서 빨간 배너 띄움.
 *
 * @param answer 챗봇 텍스트 응답 (마크다운 없음)
 * @param emergencyKeywordDetected 응급 키워드 매칭 시 해당 키워드 — 없으면 null
 * @param disclaimer 매 응답에 포함되는 면책 문구
 */
public record SymptomFollowupResponse(
        String answer,
        String emergencyKeywordDetected,
        String disclaimer
) {}
