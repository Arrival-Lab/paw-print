package com.arrivallab.pawprint.domain.weather.service;

import org.springframework.stereotype.Component;

/**
 * 위경도 → 에어코리아 sidoName 매핑. Bounding box 단순 매핑.
 * 17개 광역시도 중심 좌표와의 거리로 가장 가까운 시도 선택.
 *
 * 한국 외 좌표는 "전국" 반환 — 에어코리아 전국 평균.
 */
@Component
public class SidoResolver {

    /** sidoName 은 에어코리아 API 가 받는 정확한 표기. */
    private static final Sido[] SIDOS = {
            new Sido("서울", 37.5665, 126.9780),
            new Sido("부산", 35.1796, 129.0756),
            new Sido("대구", 35.8714, 128.6014),
            new Sido("인천", 37.4563, 126.7052),
            new Sido("광주", 35.1595, 126.8526),
            new Sido("대전", 36.3504, 127.3845),
            new Sido("울산", 35.5384, 129.3114),
            new Sido("세종", 36.4801, 127.2890),
            new Sido("경기", 37.4138, 127.5183),
            new Sido("강원", 37.8228, 128.1555),
            new Sido("충북", 36.6357, 127.4917),
            new Sido("충남", 36.5184, 126.8000),
            new Sido("전북", 35.7175, 127.1530),
            new Sido("전남", 34.8161, 126.4630),
            new Sido("경북", 36.4919, 128.8889),
            new Sido("경남", 35.4606, 128.2132),
            new Sido("제주", 33.4996, 126.5312),
    };

    public String resolve(double lat, double lng) {
        // 한국 영역 밖이면 전국 평균
        if (lat < 33.0 || lat > 38.7 || lng < 124.5 || lng > 131.9) return "전국";

        double bestDist = Double.MAX_VALUE;
        String best = "전국";
        for (Sido s : SIDOS) {
            double d = (lat - s.lat) * (lat - s.lat) + (lng - s.lng) * (lng - s.lng);
            if (d < bestDist) { bestDist = d; best = s.name; }
        }
        return best;
    }

    private record Sido(String name, double lat, double lng) {}
}
