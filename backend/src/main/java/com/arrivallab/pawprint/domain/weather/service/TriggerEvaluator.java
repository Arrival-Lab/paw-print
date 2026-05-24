package com.arrivallab.pawprint.domain.weather.service;

import com.arrivallab.pawprint.domain.weather.dto.WeatherSnapshot;
import com.arrivallab.pawprint.domain.weather.dto.WeatherTrigger;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.function.Predicate;

@Component
public class TriggerEvaluator {

    /**
     * 우선순위 = 리스트 순서. 위에서부터 첫 매칭 트리거 반환, 없으면 NONE.
     * 새 트리거 추가 시 RULES 에 한 줄만 추가 (OCP — evaluate() 자체는 수정 불필요).
     */
    private static final List<TriggerRule> RULES = List.of(
            new TriggerRule(w -> gte(w.feelsLikeC(), 33),
                    WeatherTrigger.HEATWAVE),
            new TriggerRule(w -> lte(w.feelsLikeC(), -5),
                    WeatherTrigger.COLDWAVE),
            // 비 트리거는 KMA 초단기실황 PTY(강수형태) 가 "지금 비/눈/소나기 옴" 일 때만.
            // PCP(예보 강수량) 합산은 "1mm 미만" 시간대 누적으로 맑은 날 오탐 유발하므로 사용 안 함.
            new TriggerRule(w -> isRainingNow(w) && (gte(w.rainMmHourly(), 10) || gte(w.rainMmDaily(), 30)),
                    WeatherTrigger.RAIN_HEAVY),
            new TriggerRule(w -> gte(w.pm25(), 36) || gte(w.pm10(), 81),
                    WeatherTrigger.DUST_PM),
            new TriggerRule(w -> Boolean.TRUE.equals(w.yellowDustAlert()),
                    WeatherTrigger.YELLOW_DUST),
            new TriggerRule(w -> Boolean.TRUE.equals(w.thunderAlert()),
                    WeatherTrigger.THUNDER),
            new TriggerRule(TriggerEvaluator::isRainingNow,
                    WeatherTrigger.RAIN_LIGHT),
            new TriggerRule(w -> gte(w.tempDiffC(), 10),
                    WeatherTrigger.TEMP_DIFF),
            new TriggerRule(w -> gte(w.humidity(), 80) && gte(w.tempC(), 25),
                    WeatherTrigger.HUMIDITY_HIGH),
            new TriggerRule(w -> lte(w.humidity(), 30),
                    WeatherTrigger.HUMIDITY_LOW),
            new TriggerRule(w -> gte(w.uvIndex(), 8),
                    WeatherTrigger.UV_HIGH),
            new TriggerRule(w -> gte(w.windMs(), 14),
                    WeatherTrigger.WIND_STRONG)
    );

    public WeatherTrigger evaluate(WeatherSnapshot w) {
        return RULES.stream()
                .filter(r -> r.matches().test(w))
                .findFirst()
                .map(TriggerRule::trigger)
                .orElse(WeatherTrigger.NONE);
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

    private static boolean isRainingNow(WeatherSnapshot w) {
        return w.pty() != null && w.pty() != 0;
    }

    private static boolean gte(Double v, double t) { return v != null && v >= t; }
    private static boolean lte(Double v, double t) { return v != null && v <= t; }

    private record TriggerRule(Predicate<WeatherSnapshot> matches, WeatherTrigger trigger) {}
}
