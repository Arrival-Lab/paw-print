package com.arrivallab.pawprint.domain.vaccine.entity;

/**
 * 반복 케어 항목 카테고리 — 같은 엔티티(반복·D-day·알림 엔진)를 탭으로만 가른다.
 * VACCINE   : 건강 탭 "백신" — 종합백신·광견병 등 병원 접종.
 * RECURRING : 일상 탭 "정기체크" — 벼룩약·심장사상충 등 보호자가 정기적으로 챙기는 약/케어.
 */
public enum VaccineCategory {
    VACCINE,
    RECURRING
}
