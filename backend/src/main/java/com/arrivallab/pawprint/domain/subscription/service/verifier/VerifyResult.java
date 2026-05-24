package com.arrivallab.pawprint.domain.subscription.service.verifier;

import java.time.LocalDateTime;

/** 영수증 검증 성공 결과 — 만료 시각 + 스토어 트랜잭션 식별자. */
public record VerifyResult(LocalDateTime expiresAt, String transactionId) {}
