package com.arrivallab.pawprint.global.constants;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;

/**
 * 구독 티어별 한도. 게이팅 위치에서 SubscriptionType.FREE 비교 대신 이 record 의 필드와 직접 비교.
 *
 * 무제한은 Integer.MAX_VALUE 로 표현 → 호출부에서 별도 분기 없이 "count >= limit" 비교가 자연스럽게 통과.
 *
 * 현재 정책:
 *  FREE   — 체험판. 모든 한도 가장 빡빡.
 *  FRIEND — 솔로 보호자 (혼자 또는 1명과 공유). 한 곳에 깊이.
 *  FAMILY — 다묘/다견 + 다수 보호자. 전부 무제한.
 *  PREMIUM (레거시) — FAMILY 와 동일 처리.
 *
 * 프론트 `frontend/constants/config.ts` 와 값을 맞춰야 함.
 */
public record SubscriptionLimits(
        int maxPets,
        int maxPhotosPerItem,
        int maxOcrPerMonth,
        int maxAiChecksPerMonth,
        int maxVaccineAlerts,
        int maxShareMembers,
        int metricsDays
) {
    public static final int UNLIMITED = Integer.MAX_VALUE;

    public static final SubscriptionLimits FREE = new SubscriptionLimits(
            3, 5, 5, 5, 3, 1, 30
    );

    public static final SubscriptionLimits FRIEND = new SubscriptionLimits(
            5, UNLIMITED, 20, 20, UNLIMITED, 2, UNLIMITED
    );

    public static final SubscriptionLimits FAMILY = new SubscriptionLimits(
            UNLIMITED, UNLIMITED, UNLIMITED, UNLIMITED, UNLIMITED, UNLIMITED, UNLIMITED
    );

    public static SubscriptionLimits of(SubscriptionType type) {
        return switch (type) {
            case FREE -> FREE;
            case FRIEND -> FRIEND;
            case FAMILY, PREMIUM -> FAMILY;
        };
    }
}
