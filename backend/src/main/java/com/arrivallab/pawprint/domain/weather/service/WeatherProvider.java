package com.arrivallab.pawprint.domain.weather.service;

import com.arrivallab.pawprint.domain.weather.dto.WeatherSnapshot;

/**
 * 외부 날씨 API 추상화. 현재는 MockWeatherProvider 로 응답.
 * 실제 연동 시 기상청(KMA) 단기예보 + 에어코리아(미세먼지) 결합 구현체로 교체.
 */
public interface WeatherProvider {
    WeatherSnapshot fetch(double lat, double lng);
}
