package com.arrivallab.pawprint.domain.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * 한국환경공단 에어코리아 (ArpltnInforInqireSvc) 호출.
 * /getCtprvnRltmMesureDnsty: 시도별 실시간 측정정보 → 평균 PM2.5/PM10.
 *
 * 측정소 단위 정확도가 필요해지면 가까운 측정소 API + TM 좌표 변환 도입 검토.
 * 현재는 시도 평균이면 트리거 평가(임계값 기반)에 충분.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KecoAirClient {

    private static final String BASE_URL = "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc";

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient http = RestClient.builder().build();

    public AirSnapshot fetchBySido(String serviceKey, String sidoName) {
        URI uri = UriComponentsBuilder.fromUriString(BASE_URL + "/getCtprvnRltmMesureDnsty")
                .queryParam("serviceKey", serviceKey)
                .queryParam("returnType", "json")
                .queryParam("numOfRows", 100)
                .queryParam("pageNo", 1)
                .queryParam("sidoName", sidoName)
                .queryParam("ver", "1.0")
                .build(true).toUri();

        try {
            String body = http.get().uri(uri).retrieve().body(String.class);
            JsonNode items = objectMapper.readTree(body)
                    .path("response").path("body").path("items");
            if (!items.isArray() || items.isEmpty()) return null;

            double pm25Sum = 0, pm10Sum = 0;
            int pm25Count = 0, pm10Count = 0;
            for (JsonNode item : items) {
                Double pm25 = parseValue(item.path("pm25Value").asText(null));
                Double pm10 = parseValue(item.path("pm10Value").asText(null));
                if (pm25 != null) { pm25Sum += pm25; pm25Count++; }
                if (pm10 != null) { pm10Sum += pm10; pm10Count++; }
            }
            return new AirSnapshot(
                    pm25Count > 0 ? pm25Sum / pm25Count : null,
                    pm10Count > 0 ? pm10Sum / pm10Count : null
            );
        } catch (Exception e) {
            log.warn("KECO air fetch failed sido={}: {}", sidoName, e.getMessage());
            return null;
        }
    }

    public record AirSnapshot(Double pm25, Double pm10) {}

    /** 측정소 점검·통신장애 시 "-" 반환됨. 그런 값은 null 로. */
    private static Double parseValue(String raw) {
        if (raw == null || raw.isBlank() || raw.equals("-")) return null;
        try { return Double.parseDouble(raw); } catch (Exception e) { return null; }
    }
}
