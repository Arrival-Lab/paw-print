package com.arrivallab.pawprint.domain.vaccine.entity;

import java.time.LocalDate;

/**
 * 백신/정기 약물의 반복 주기.
 * NONE = 단발(기본 — 종합백신, 광견병 등). 알림 후 다음 일정 자동 갱신 안 함.
 * MONTHLY = 매월(벼룩약·심장사상충 약 등). 알림 후 next_vaccine_at += 1 month.
 * QUARTERLY = 분기마다(일부 외용약). next_vaccine_at += 3 months.
 * YEARLY = 매년(연간 종합 검진/접종). next_vaccine_at += 1 year.
 */
public enum RecurrenceType {
    NONE,
    MONTHLY,
    QUARTERLY,
    YEARLY;

    public LocalDate nextFrom(LocalDate base) {
        if (base == null) return null;
        return switch (this) {
            case NONE -> null;
            case MONTHLY -> base.plusMonths(1);
            case QUARTERLY -> base.plusMonths(3);
            case YEARLY -> base.plusYears(1);
        };
    }
}
