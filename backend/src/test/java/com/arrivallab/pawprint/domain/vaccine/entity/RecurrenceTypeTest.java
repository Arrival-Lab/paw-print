package com.arrivallab.pawprint.domain.vaccine.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RecurrenceType.nextFrom() 의 월말·윤년 경계 동작을 고정하는 특성(characterization) 테스트.
 * nextFrom 은 JDK LocalDate.plusMonths/plusYears 에 위임하므로,
 * 여기서 검증하는 것은 사실상 "JDK 가 월말 overflow 를 어떻게 처리하는가" 를 우리 도메인 기대값으로 못박는 것.
 */
class RecurrenceTypeTest {

    @DisplayName("주기별 다음 예정일: 월말/윤년 경계에서 '그 달의 마지막 유효일'로 clamp")
    @ParameterizedTest(name = "[{index}] {0}.nextFrom({1}) = {2}")
    @CsvSource({
            // 일반 케이스 — 자명하지만 회귀 방지용으로 1개씩
            "MONTHLY,   2024-06-15, 2024-07-15",
            "YEARLY,    2024-06-15, 2025-06-15",
            // A. 1월 31일 + 1개월 → 2월 말 (2024 윤년 → 2/29)
            "MONTHLY,   2024-01-31, 2024-02-29",
            // B. 3월 31일 + 1개월 → 4월 말
            "MONTHLY,   2024-03-31, 2024-04-30",
            // C. 윤년 2/29 + 1년 → 평년 2월 말
            "YEARLY,    2024-02-29, 2025-02-28",
            // D. 11/30 + 3개월 → 연도 넘어 2025년 2월 말
            "QUARTERLY, 2024-11-30, 2025-02-28",
    })
    void nextFrom_clampsToLastValidDayOfMonth(RecurrenceType type, LocalDate base, LocalDate expected) {
        assertThat(type.nextFrom(base)).isEqualTo(expected);
    }

    @Test
    @DisplayName("NONE: 단발 주기는 자동 갱신하지 않으므로 null 반환")
    void none_returnsNull() {
        assertThat(RecurrenceType.NONE.nextFrom(LocalDate.of(2024, 6, 15))).isNull();
    }

    @DisplayName("base 가 null 이면 어떤 주기든 null 반환 (가드)")
    @ParameterizedTest(name = "[{index}] {0}.nextFrom(null) = null")
    @EnumSource(RecurrenceType.class)
    void nullBase_returnsNull(RecurrenceType type) {
        assertThat(type.nextFrom(null)).isNull();
    }
}
