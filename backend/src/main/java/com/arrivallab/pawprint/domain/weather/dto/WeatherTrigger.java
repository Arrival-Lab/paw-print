package com.arrivallab.pawprint.domain.weather.dto;

/**
 * 우선순위 순서대로 평가. 위에서부터 가장 먼저 매칭되는 트리거를 반환.
 * NONE 이면 클라이언트가 월별 케어팁으로 폴백.
 */
public enum WeatherTrigger {
    HEATWAVE,       // 체감 33°C↑
    COLDWAVE,       // 체감 -5°C↓
    RAIN_HEAVY,     // 시간당 10mm↑ or 일강수 30mm↑
    DUST_PM,        // PM2.5 36↑ or PM10 81↑
    YELLOW_DUST,    // 황사특보
    THUNDER,        // 낙뢰 예보/특보
    RAIN_LIGHT,     // 일강수 1~10mm
    TEMP_DIFF,      // 일교차 10°C↑
    HUMIDITY_HIGH,  // 습도 80%↑ + 기온 25°C↑
    HUMIDITY_LOW,   // 습도 30%↓
    UV_HIGH,        // UV 8↑
    WIND_STRONG,    // 풍속 14m/s↑
    NONE,
}
