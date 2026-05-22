package com.arrivallab.pawprint.domain.diary.entity;

public enum MetricType {
    WEIGHT, BUN, CREATININE,
    // 일상 트래킹 — 무료 응답자가 비정형 메모로 남기던 지표를 정식 메트릭으로 흡수.
    // 단위는 프론트에서 type별로 자동 매핑 (WATER_INTAKE=ml, FOOD_INTAKE=g, *_COUNT=회).
    WATER_INTAKE, FOOD_INTAKE, BOWEL_COUNT, URINE_COUNT, VOMIT_COUNT,
    CUSTOM
}
