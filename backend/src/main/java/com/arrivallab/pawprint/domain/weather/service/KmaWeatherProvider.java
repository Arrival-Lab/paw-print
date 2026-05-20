package com.arrivallab.pawprint.domain.weather.service;

import com.arrivallab.pawprint.domain.weather.config.WeatherProperties;
import com.arrivallab.pawprint.domain.weather.dto.WeatherSnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 기상청 + 에어코리아 실 연동 WeatherProvider.
 * weather.provider=kma 일 때만 로드.
 *
 * 어느 한 클라이언트가 실패해도 가능한 한 채워서 반환 — TriggerEvaluator 가 null 필드는 알아서 스킵.
 * 둘 다 실패하면 모든 필드 null → trigger NONE → 프론트 월별팁 폴백.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "weather.provider", havingValue = "kma")
@RequiredArgsConstructor
public class KmaWeatherProvider implements WeatherProvider {

    private final WeatherProperties props;
    private final KmaWeatherClient kma;
    private final KecoAirClient keco;
    private final SidoResolver sidoResolver;

    @Override
    public WeatherSnapshot fetch(double lat, double lng) {
        try {
            return fetchInternal(lat, lng);
        } catch (Exception e) {
            log.error("Weather fetch failed lat={} lng={}", lat, lng, e);
            // 어떤 예외도 500 으로 새지 않도록 — 전 필드 null 로 폴백 (트리거 NONE)
            return new WeatherSnapshot(null, null, null, null, null, null, null, null, null, null, null, null);
        }
    }

    private WeatherSnapshot fetchInternal(double lat, double lng) {
        KmaGridConverter.Grid grid = KmaGridConverter.toGrid(lat, lng);
        boolean hasKmaKey  = props.kma()  != null && hasText(props.kma().serviceKey());
        boolean hasKecoKey = props.keco() != null && hasText(props.keco().serviceKey());
        log.debug("Weather fetch lat={} lng={} grid=({},{}) kmaKey={} kecoKey={}",
                lat, lng, grid.nx(), grid.ny(), hasKmaKey, hasKecoKey);

        KmaWeatherClient.Observation obs = hasKmaKey
                ? kma.fetchObservation(props.kma().serviceKey(), grid.nx(), grid.ny()) : null;
        KmaWeatherClient.DailyForecast fcst = hasKmaKey
                ? kma.fetchDailyForecast(props.kma().serviceKey(), grid.nx(), grid.ny()) : null;
        KecoAirClient.AirSnapshot air = hasKecoKey
                ? keco.fetchBySido(props.keco().serviceKey(), sidoResolver.resolve(lat, lng)) : null;

        Double tempC      = obs != null ? obs.tempC() : null;
        Double humidity   = obs != null ? obs.humidity() : null;
        Double windMs     = obs != null ? obs.windMs() : null;
        Double rainHourly = obs != null ? obs.rainMmHourly() : null;
        Double rainDaily  = fcst != null ? fcst.rainMmDaily() : rainHourly;
        Double tempDiff   = (fcst != null && fcst.tmaxC() != null && fcst.tminC() != null)
                ? fcst.tmaxC() - fcst.tminC() : null;
        Double feelsLike  = feelsLike(tempC, humidity, windMs);
        Double pm25       = air != null ? air.pm25() : null;
        Double pm10       = air != null ? air.pm10() : null;

        return new WeatherSnapshot(
                tempC, feelsLike, rainHourly, rainDaily,
                humidity, windMs,
                pm25, pm10,
                null,        // uvIndex — 생활기상지수 API 별도 신청 필요
                tempDiff,
                null,        // yellowDustAlert — 특보 API 별도
                null         // thunderAlert — 특보 API 별도
        );
    }

    /**
     * 체감온도 근사. KMA 가 직접 제공 안 하므로 클라이언트에서 계산.
     * - 더울 때 (≥27°C, 습도 ≥40%): Heat Index (Rothfusz 단순화)
     * - 추울 때 (≤10°C, 풍속 ≥1.34 m/s ≈ 4.8 km/h): Wind Chill (북미 공식)
     * - 그 외: 기온 그대로
     */
    static Double feelsLike(Double tempC, Double humidity, Double windMs) {
        if (tempC == null) return null;
        if (tempC >= 27 && humidity != null && humidity >= 40) {
            double T = tempC * 9.0 / 5.0 + 32.0;
            double R = humidity;
            double hi = -42.379 + 2.04901523 * T + 10.14333127 * R
                    - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R
                    + 0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
            return (hi - 32.0) * 5.0 / 9.0;
        }
        if (tempC <= 10 && windMs != null && windMs >= 1.34) {
            double v = windMs * 3.6; // km/h
            return 13.12 + 0.6215 * tempC - 11.37 * Math.pow(v, 0.16)
                    + 0.3965 * tempC * Math.pow(v, 0.16);
        }
        return tempC;
    }

    private static boolean hasText(String s) { return s != null && !s.isBlank(); }
}
