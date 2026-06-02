package com.arrivallab.pawprint.domain.app.dto;

/**
 * 클라이언트 버전 게이트용 — 스토어에 올라간 최신/최소 지원 버전.
 * 프론트가 설치된 버전과 비교해 권장(latest 미만)/강제(min 미만) 업데이트 모달을 띄운다.
 */
public record AppVersionResponse(
        String latestVersion,
        String minVersion
) {
}
