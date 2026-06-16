package com.arrivallab.pawprint.domain.subscription.dto;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 구독 활성 판정(isActive)의 만료 경계 동작을 고정한다.
 * from() 이 시간을 직접 호출하지 않고 주입된 Clock 을 쓰도록 만들어,
 * "만료 시각 == 지금" 같은 경계를 결정적으로 재현할 수 있어야 한다.
 */
class SubscriptionStatusResponseTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 6, 16, 12, 0, 0);

    /** LocalDateTime.now(clock) 가 정확히 NOW 를 돌려주는 고정 시계. */
    private static final Clock FIXED = Clock.fixed(NOW.atZone(ZONE).toInstant(), ZONE);

    private User userWith(SubscriptionType type, LocalDateTime expiresAt) {
        return User.builder()
                .subscriptionType(type)
                .subscriptionExpiresAt(expiresAt)
                .build();
    }

    @Test
    @DisplayName("만료 시각이 지금보다 미래면 활성")
    void active_whenExpiresInFuture() {
        User user = userWith(SubscriptionType.FAMILY, NOW.plusSeconds(1));
        assertThat(SubscriptionStatusResponse.from(user, FIXED).isActive()).isTrue();
    }

    @Test
    @DisplayName("만료 시각이 정확히 지금과 같으면 비활성 (isAfter 는 동일 시각에 false)")
    void inactive_whenExpiresExactlyNow() {
        User user = userWith(SubscriptionType.FAMILY, NOW);
        assertThat(SubscriptionStatusResponse.from(user, FIXED).isActive()).isFalse();
    }

    @Test
    @DisplayName("만료 시각이 지금보다 과거면 비활성")
    void inactive_whenExpiredOneSecondAgo() {
        User user = userWith(SubscriptionType.FAMILY, NOW.minusSeconds(1));
        assertThat(SubscriptionStatusResponse.from(user, FIXED).isActive()).isFalse();
    }

    @Test
    @DisplayName("유료 티어 + 만료 시각 null 이면 활성 (현재 정책 그대로 고정)")
    void active_whenPaidAndExpiresAtNull() {
        User user = userWith(SubscriptionType.FAMILY, null);
        assertThat(SubscriptionStatusResponse.from(user, FIXED).isActive()).isTrue();
    }

    @Test
    @DisplayName("FREE 티어는 만료 시각이 미래여도 비활성")
    void inactive_whenFreeTier() {
        User user = userWith(SubscriptionType.FREE, NOW.plusYears(1));
        assertThat(SubscriptionStatusResponse.from(user, FIXED).isActive()).isFalse();
    }
}
