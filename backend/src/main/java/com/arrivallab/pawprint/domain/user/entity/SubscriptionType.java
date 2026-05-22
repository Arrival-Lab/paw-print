package com.arrivallab.pawprint.domain.user.entity;

/**
 * 구독 티어.
 *  FREE     무료
 *  FRIEND   ₩2,900/월 — 1단계 유료 (펫 무제한·OCR 확대·AI 체크 확대)
 *  FAMILY   ₩4,900/월 또는 ₩34,900/년 — 전부 무제한 + AI 증상 체크 무제한
 *  PREMIUM  레거시 — 신규 가입 안 함. 기존 사용자 호환용. FAMILY 와 동일하게 처리.
 *
 * 모든 paid 티어를 한 번에 식별하려면 {@link #isPaid()} 사용. 신규 게이팅 로직은
 * "FRIEND 만 한도 적용 / FAMILY·PREMIUM 무제한" 같이 분기 시 enum 직접 비교.
 */
public enum SubscriptionType {
    FREE, FRIEND, FAMILY, PREMIUM;

    public boolean isPaid() {
        return this != FREE;
    }
}
