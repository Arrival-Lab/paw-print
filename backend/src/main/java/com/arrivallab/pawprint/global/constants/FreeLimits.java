package com.arrivallab.pawprint.global.constants;

/**
 * 무료 플랜 한도 — 백엔드 전 도메인에서 참조하는 단일 출처.
 * 프론트 `frontend/constants/config.ts` 와 값을 맞춰야 함.
 */
public final class FreeLimits {

    public static final int MAX_PETS = 3;
    public static final int MAX_PHOTOS_PER_ITEM = 5;
    public static final int MAX_OCR_PER_MONTH = 5;
    public static final int MAX_VACCINE_ALERTS = 3;
    public static final int MAX_SHARE_MEMBERS = 1;
    public static final int METRICS_DAYS = 30;

    private FreeLimits() {}
}
