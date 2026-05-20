package com.arrivallab.pawprint.domain.weather.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * 기상청 단기예보 조회서비스 (VilageFcstInfoService_2.0) 호출.
 * - getUltraSrtNcst: 초단기실황 (현재 관측값) — T1H/RN1/REH/WSD
 * - getVilageFcst:   단기예보 (3일) — TMX/TMN/PCP 합산
 *
 * 응답 실패 / 키 미발급 / 네트워크 오류 시 null 반환 (provider 가 trigger NONE 처리).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KmaWeatherClient {

    private static final String BASE_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient http = RestClient.builder().build();

    public Observation fetchObservation(String serviceKey, int nx, int ny) {
        BaseTime bt = ultraSrtNcstBaseTime(LocalDateTime.now());
        URI uri = UriComponentsBuilder.fromUriString(BASE_URL + "/getUltraSrtNcst")
                .queryParam("serviceKey", serviceKey)
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 100)
                .queryParam("dataType", "JSON")
                .queryParam("base_date", bt.date)
                .queryParam("base_time", bt.time)
                .queryParam("nx", nx)
                .queryParam("ny", ny)
                .build(true).toUri();

        try {
            String body = http.get().uri(uri).retrieve().body(String.class);
            Map<String, String> values = parseItems(body, "obsrValue");
            return new Observation(
                    parseDouble(values.get("T1H")),
                    parseRain(values.get("RN1")),
                    parseDouble(values.get("REH")),
                    parseDouble(values.get("WSD"))
            );
        } catch (Exception e) {
            log.warn("KMA observation fetch failed nx={} ny={}: {}", nx, ny, e.getMessage());
            return null;
        }
    }

    public DailyForecast fetchDailyForecast(String serviceKey, int nx, int ny) {
        BaseTime bt = vilageFcstBaseTime(LocalDateTime.now());
        URI uri = UriComponentsBuilder.fromUriString(BASE_URL + "/getVilageFcst")
                .queryParam("serviceKey", serviceKey)
                .queryParam("pageNo", 1)
                .queryParam("numOfRows", 1000) // 3일치 다 받으려면 충분히 크게
                .queryParam("dataType", "JSON")
                .queryParam("base_date", bt.date)
                .queryParam("base_time", bt.time)
                .queryParam("nx", nx)
                .queryParam("ny", ny)
                .build(true).toUri();

        try {
            String body = http.get().uri(uri).retrieve().body(String.class);
            return aggregateDaily(body, LocalDate.now());
        } catch (Exception e) {
            log.warn("KMA vilage forecast fetch failed nx={} ny={}: {}", nx, ny, e.getMessage());
            return null;
        }
    }

    public record Observation(Double tempC, Double rainMmHourly, Double humidity, Double windMs) {}
    public record DailyForecast(Double tmaxC, Double tminC, Double rainMmDaily) {}

    /** 초단기실황은 매시 정각 발표 + HH40 이후 호출 가능. 그 전이면 직전 시각 사용. */
    static BaseTime ultraSrtNcstBaseTime(LocalDateTime now) {
        LocalDateTime base = now.getMinute() < 40 ? now.minusHours(1) : now;
        return new BaseTime(base.format(DATE_FMT), String.format("%02d00", base.getHour()));
    }

    /** 단기예보 발표시각: 02, 05, 08, 11, 14, 17, 20, 23 + HH10 이후. */
    static BaseTime vilageFcstBaseTime(LocalDateTime now) {
        int[] slots = {23, 20, 17, 14, 11, 8, 5, 2};
        int hour = now.getHour();
        int minute = now.getMinute();
        for (int slot : slots) {
            if (hour > slot || (hour == slot && minute >= 10)) {
                LocalDateTime base = now.withHour(slot);
                return new BaseTime(base.format(DATE_FMT), String.format("%02d00", slot));
            }
        }
        // 새벽 02:10 이전이면 어제 23시 사용
        LocalDateTime base = now.minusDays(1).withHour(23);
        return new BaseTime(base.format(DATE_FMT), "2300");
    }

    record BaseTime(String date, String time) {}

    /** items[].category → items[].{valueField} 평탄화. 중복 카테고리는 마지막 값 사용. */
    private Map<String, String> parseItems(String json, String valueField) throws Exception {
        Map<String, String> out = new HashMap<>();
        JsonNode items = objectMapper.readTree(json)
                .path("response").path("body").path("items").path("item");
        if (!items.isArray()) return out;
        for (JsonNode item : items) {
            String cat = item.path("category").asText(null);
            String val = item.path(valueField).asText(null);
            if (cat != null && val != null) out.put(cat, val);
        }
        return out;
    }

    /** 단기예보 응답에서 오늘(target) 의 TMX/TMN + PCP 합산. */
    private DailyForecast aggregateDaily(String json, LocalDate target) throws Exception {
        JsonNode items = objectMapper.readTree(json)
                .path("response").path("body").path("items").path("item");
        if (!items.isArray()) return null;
        String targetStr = target.format(DATE_FMT);

        Double tmax = null, tmin = null;
        double rainSum = 0;
        boolean anyRain = false;

        for (JsonNode item : items) {
            if (!targetStr.equals(item.path("fcstDate").asText())) continue;
            String cat = item.path("category").asText();
            String val = item.path("fcstValue").asText();
            switch (cat) {
                case "TMX" -> tmax = parseDouble(val);
                case "TMN" -> tmin = parseDouble(val);
                case "PCP" -> {
                    Double mm = parseRain(val);
                    if (mm != null) { rainSum += mm; anyRain = true; }
                }
            }
        }
        return new DailyForecast(tmax, tmin, anyRain ? rainSum : null);
    }

    /** KMA 강수량 표기: "강수없음" → 0, "1mm 미만" → 0.5, "30.0~50.0mm" → 40, "50.0mm 이상" → 60, "1.5mm" → 1.5. */
    static Double parseRain(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.trim();
        if (s.equals("강수없음") || s.equals("-") || s.equals("null") || s.equals("0")) return 0.0;
        if (s.contains("미만")) return 0.5;
        if (s.contains("이상")) {
            Double v = extractFirstNumber(s);
            return v == null ? null : v + 10;
        }
        if (s.contains("~")) {
            String[] parts = s.split("~");
            Double a = extractFirstNumber(parts[0]);
            Double b = parts.length > 1 ? extractFirstNumber(parts[1]) : null;
            if (a != null && b != null) return (a + b) / 2;
            return a;
        }
        return extractFirstNumber(s);
    }

    private static Double extractFirstNumber(String s) {
        StringBuilder sb = new StringBuilder();
        boolean seenDot = false;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) sb.append(c);
            else if (c == '.' && !seenDot) { sb.append(c); seenDot = true; }
            else if (sb.length() > 0) break;
        }
        if (sb.length() == 0) return null;
        try { return Double.parseDouble(sb.toString()); } catch (Exception e) { return null; }
    }

    private static Double parseDouble(String s) {
        if (s == null || s.isBlank()) return null;
        try { return Double.parseDouble(s); } catch (Exception e) { return null; }
    }
}
