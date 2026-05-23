package com.arrivallab.pawprint.domain.weather.dto;

/**
 * 단일 시점 날씨 스냅샷. WeatherProvider 가 채워서 반환, TriggerEvaluator 가 소비.
 * null 필드는 "측정/제공 안됨" 으로 간주 — 평가 시 해당 트리거 건너뜀.
 */
public record WeatherSnapshot(
        Double tempC,
        Double feelsLikeC,
        Double rainMmHourly,    // 최근 1시간
        Double rainMmDaily,     // 당일 누적
        Double humidity,        // %
        Double windMs,
        Double pm25,            // ㎍/㎥
        Double pm10,            // ㎍/㎥
        Double uvIndex,
        Double tempDiffC,       // 최고-최저
        Boolean yellowDustAlert,
        Boolean thunderAlert,
        Integer pty             // 강수형태 (0=없음, 1=비, 2=비/눈, 3=눈, 4=소나기). null=관측 실패.
) {}
