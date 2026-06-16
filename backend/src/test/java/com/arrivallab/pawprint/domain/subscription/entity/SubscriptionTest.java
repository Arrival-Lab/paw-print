package com.arrivallab.pawprint.domain.subscription.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Subscription.renew() 의 단조(monotonic) 불변식 검증.
 * webhook 재전송/순서 뒤바뀜에도 만료시각을 앞당기지 않아야 한다 (구독 조기만료 방지).
 * 정책(나): 만료시각을 바꾸지 않는 알림은 status 도 건드리지 않는다 — "무시할 알림이면 아무것도 안 바꾼다".
 */
class SubscriptionTest {

    private static final LocalDateTime JUN_30 = LocalDateTime.of(2026, 6, 30, 0, 0);
    private static final LocalDateTime DEC_31 = LocalDateTime.of(2026, 12, 31, 0, 0);
    private static final LocalDateTime NEXT_YEAR = LocalDateTime.of(2027, 12, 31, 0, 0);

    private Subscription with(LocalDateTime expiresAt, SubscriptionStatus status) {
        return Subscription.builder()
                .expiresAt(expiresAt)
                .status(status)
                .build();
    }

    @Test
    @DisplayName("케이스 1: 더 미래의 만료시각으로 renew 하면 연장하고 ACTIVE 로 복귀시킨다")
    void renew_withLaterExpiry_extendsAndActivates() {
        Subscription sub = with(JUN_30, SubscriptionStatus.EXPIRED); // 만료됐던 구독

        sub.renew(NEXT_YEAR); // 정상 갱신 알림 (미래)

        assertThat(sub.getExpiresAt()).isEqualTo(NEXT_YEAR);
        assertThat(sub.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
    }

    @Test
    @DisplayName("케이스 2: 동일한 만료시각으로 renew 하면(정확한 재전송) 아무것도 바꾸지 않는다")
    void renew_withSameExpiry_changesNothing() {
        Subscription sub = with(DEC_31, SubscriptionStatus.ACTIVE);

        sub.renew(DEC_31);

        assertThat(sub.getExpiresAt()).isEqualTo(DEC_31);
        assertThat(sub.getStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
    }

    @Test
    @DisplayName("케이스 3: 과거 만료시각으로 renew 하면(순서 뒤바뀐 재전송) expiresAt 을 앞당기지 않는다")
    void renew_withEarlierExpiry_doesNotShorten() {
        Subscription sub = with(DEC_31, SubscriptionStatus.ACTIVE);

        sub.renew(JUN_30); // 뒤늦게 도착한 옛 갱신 알림

        assertThat(sub.getExpiresAt()).isEqualTo(DEC_31);
    }

    @Test
    @DisplayName("정책(나): 과거/중복 알림은 종료된(CANCELLED) 구독을 되살리지 않는다")
    void renew_withEarlierExpiry_doesNotResurrectTerminated() {
        Subscription sub = with(DEC_31, SubscriptionStatus.CANCELLED); // 환불/취소된 구독

        sub.renew(JUN_30); // 뒤늦게 도착한 옛 갱신 알림

        assertThat(sub.getExpiresAt()).isEqualTo(DEC_31);
        assertThat(sub.getStatus()).isEqualTo(SubscriptionStatus.CANCELLED);
    }
}
