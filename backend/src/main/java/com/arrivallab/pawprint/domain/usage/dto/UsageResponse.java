package com.arrivallab.pawprint.domain.usage.dto;

/**
 * 현재 유저의 무료 한도 카운터 응답.
 * 프론트 UsageMeter 컴포넌트가 "n/최대" 표시에 사용.
 * 최대값은 프론트 Config 에 있으므로 백엔드는 현재 사용량만 제공.
 */
public record UsageResponse(
        long ocrThisMonth,
        String yearMonth
) {
}
