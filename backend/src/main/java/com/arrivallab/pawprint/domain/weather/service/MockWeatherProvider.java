package com.arrivallab.pawprint.domain.weather.service;

import com.arrivallab.pawprint.domain.weather.dto.WeatherSnapshot;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.LocalTime;

/**
 * 실 날씨 API 연동 전 임시 구현. 시간대만으로 가짜 스냅샷 생성.
 * weather.provider=mock 이거나 미설정 시 로드. 운영 환경에선 KmaWeatherProvider 사용.
 */
@Component
@ConditionalOnProperty(name = "weather.provider", havingValue = "mock", matchIfMissing = true)
public class MockWeatherProvider implements WeatherProvider {

    @Override
    public WeatherSnapshot fetch(double lat, double lng) {
        // 시간대 + 위도(적도에 가까울수록 따뜻) 기반 그럴듯한 값. 진짜 연동 전 데모용.
        // lat/lng 을 honor 해서 LSP 계약 유지 — 호출자가 위치별 차이를 기대해도 최소한 위도 반영됨.
        int hour = LocalTime.now().getHour();
        double diurnal = Math.sin(hour / 24.0 * Math.PI * 2) * 8;  // -8 ~ +8
        double latitudeFactor = (90 - Math.abs(lat)) / 90 * 14;    // 적도 14℃, 극지 0℃
        double tempC = 12 + latitudeFactor + diurnal;
        return new WeatherSnapshot(
                tempC,
                tempC - 1,
                0.0,
                0.0,
                60.0,
                3.0,
                25.0,
                40.0,
                3.0,
                7.0,
                false,
                false,
                0
        );
    }
}
