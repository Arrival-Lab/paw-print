package com.arrivallab.pawprint.domain.weather.dto;

/**
 * 홈 화면 케어 카드용 응답.
 * trigger 가 NONE 이면 프론트가 월별 케어팁으로 폴백.
 */
public record WeatherTipResponse(
        WeatherTrigger trigger,
        String label,          // 사용자 노출용 한 줄 ("호우 주의" 등)
        WeatherSnapshot weather
) {}
