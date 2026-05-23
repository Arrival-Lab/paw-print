package com.arrivallab.pawprint.domain.weather.service;

import com.arrivallab.pawprint.domain.weather.dto.WeatherSnapshot;
import com.arrivallab.pawprint.domain.weather.dto.WeatherTrigger;
import org.springframework.stereotype.Component;

@Component
public class TriggerEvaluator {

    /** 우선순위 위에서부터 첫 매칭 트리거 반환. 없으면 NONE. */
    public WeatherTrigger evaluate(WeatherSnapshot w) {
        if (gte(w.feelsLikeC(), 33))                               return WeatherTrigger.HEATWAVE;
        if (lte(w.feelsLikeC(), -5))                               return WeatherTrigger.COLDWAVE;
        // 비 트리거는 KMA 초단기실황 PTY(강수형태) 가 "지금 비/눈/소나기 옴" 일 때만.
        // PCP(예보 강수량) 합산은 "1mm 미만" 시간대 누적으로 맑은 날 오탐 유발하므로 사용 안 함.
        if (isRainingNow(w) && (gte(w.rainMmHourly(), 10) || gte(w.rainMmDaily(), 30)))
                                                                    return WeatherTrigger.RAIN_HEAVY;
        if (gte(w.pm25(), 36) || gte(w.pm10(), 81))                return WeatherTrigger.DUST_PM;
        if (Boolean.TRUE.equals(w.yellowDustAlert()))              return WeatherTrigger.YELLOW_DUST;
        if (Boolean.TRUE.equals(w.thunderAlert()))                 return WeatherTrigger.THUNDER;
        if (isRainingNow(w))                                       return WeatherTrigger.RAIN_LIGHT;
        if (gte(w.tempDiffC(), 10))                                return WeatherTrigger.TEMP_DIFF;
        if (gte(w.humidity(), 80) && gte(w.tempC(), 25))           return WeatherTrigger.HUMIDITY_HIGH;
        if (lte(w.humidity(), 30))                                 return WeatherTrigger.HUMIDITY_LOW;
        if (gte(w.uvIndex(), 8))                                   return WeatherTrigger.UV_HIGH;
        if (gte(w.windMs(), 14))                                   return WeatherTrigger.WIND_STRONG;
        return WeatherTrigger.NONE;
    }

    private static boolean isRainingNow(WeatherSnapshot w) {
        return w.pty() != null && w.pty() != 0;
    }

    public String label(WeatherTrigger trigger) {
        return switch (trigger) {
            case HEATWAVE       -> "폭염 주의";
            case COLDWAVE       -> "한파 주의";
            case RAIN_HEAVY     -> "호우 주의";
            case DUST_PM        -> "미세먼지 나쁨";
            case YELLOW_DUST    -> "황사 주의";
            case THUNDER        -> "천둥번개 주의";
            case RAIN_LIGHT     -> "비 오는 날";
            case TEMP_DIFF      -> "큰 일교차";
            case HUMIDITY_HIGH  -> "고온다습";
            case HUMIDITY_LOW   -> "건조 주의";
            case UV_HIGH        -> "자외선 강함";
            case WIND_STRONG    -> "강풍 주의";
            case NONE           -> "오늘의 케어";
        };
    }

    private static boolean gte(Double v, double t) { return v != null && v >= t; }
    private static boolean lte(Double v, double t) { return v != null && v <= t; }
    private static boolean lt (Double v, double t) { return v != null && v <  t; }
}
