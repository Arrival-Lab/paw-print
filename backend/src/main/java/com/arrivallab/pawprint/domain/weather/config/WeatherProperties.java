package com.arrivallab.pawprint.domain.weather.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * weather.* yml 슬롯 바인딩.
 * provider 가 mock 이거나 kma 키가 비어있으면 자동으로 MockWeatherProvider 사용.
 */
@ConfigurationProperties(prefix = "weather")
public record WeatherProperties(
        String provider,
        Kma kma,
        Keco keco
) {
    public record Kma(String serviceKey) {}
    public record Keco(String serviceKey) {}
}
