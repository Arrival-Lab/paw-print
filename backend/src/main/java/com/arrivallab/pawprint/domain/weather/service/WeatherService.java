package com.arrivallab.pawprint.domain.weather.service;

import com.arrivallab.pawprint.domain.weather.dto.WeatherSnapshot;
import com.arrivallab.pawprint.domain.weather.dto.WeatherTipResponse;
import com.arrivallab.pawprint.domain.weather.dto.WeatherTrigger;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private final WeatherProvider provider;
    private final TriggerEvaluator evaluator;

    // TODO: 실 API 연동 후 Spring Cache 활성화 (@EnableCaching + Caffeine).
    // 좌표 0.1° 반올림 + 시간 단위 키로 같은 지역·같은 시간대 호출은 외부 API 스킵.
    public WeatherTipResponse getCareTip(double lat, double lng) {
        WeatherSnapshot snapshot = provider.fetch(lat, lng);
        WeatherTrigger trigger = evaluator.evaluate(snapshot);
        return new WeatherTipResponse(trigger, evaluator.label(trigger), snapshot);
    }
}
