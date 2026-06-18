package com.arrivallab.pawprint.domain.hospital.provider;

import com.arrivallab.pawprint.domain.hospital.dto.GeocodeDto;
import com.arrivallab.pawprint.domain.hospital.dto.HospitalDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * 한국 밖 좌표 전용 — Google Places API (New) + Geocoding API.
 * Kakao Local API 가 한국 좌표만 지원하므로 글로벌 사용자는 이 프로바이더로 라우팅된다.
 *
 * <p>비용 메모: FieldMask 에 전화번호(nationalPhoneNumber)·영업시간 등 Enterprise SKU 필드를
 * 넣으면 호출 전체가 비싼 Enterprise 로 과금된다. 현재는 Pro SKU 필드만 요청해 비용을 낮추고,
 * 전화·영업시간은 placeUrl(Google Maps 상세 페이지)에서 확인하도록 위임한다. 한국 사용자는
 * 이 프로바이더를 타지 않으므로(=Kakao) Google 과금은 해외 트래픽 한정.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleHospitalProvider implements HospitalProvider {

    private static final String NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
    private static final String TEXT_URL = "https://places.googleapis.com/v1/places:searchText";
    private static final String GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    // Pro SKU 필드만 — 전화/영업시간(Enterprise) 제외해 과금 등급을 Pro 로 유지.
    private static final String FIELD_MASK =
            "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri";
    // Google Places circle radius 허용 최대 50,000m.
    private static final int MAX_RADIUS = 50000;

    @Value("${google.maps-api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public List<HospitalDto> findEmergencyHospitals(double lat, double lng, int radius) {
        if (apiKey.isBlank()) {
            log.warn("Google Maps API key not configured");
            return List.of();
        }
        // Google 엔 '24시' 타입이 없어 텍스트 검색으로 응급 동물병원을 찾는다.
        Map<String, Object> body = Map.of(
                "textQuery", "emergency veterinary clinic",
                "maxResultCount", 20,
                "locationBias", circle(lat, lng, radius)
        );
        return searchPlaces(TEXT_URL, body, lat, lng);
    }

    @Override
    public List<HospitalDto> findHospitals(double lat, double lng, int radius) {
        if (apiKey.isBlank()) {
            log.warn("Google Maps API key not configured");
            return List.of();
        }
        Map<String, Object> body = Map.of(
                "includedTypes", List.of("veterinary_care"),
                "maxResultCount", 20,
                "rankPreference", "DISTANCE",
                "locationRestriction", circle(lat, lng, radius)
        );
        return searchPlaces(NEARBY_URL, body, lat, lng);
    }

    @Override
    public GeocodeDto geocode(String query, Double biasLat, Double biasLng) {
        if (apiKey.isBlank()) {
            log.warn("Google Maps API key not configured");
            return null;
        }
        if (query == null || query.isBlank()) {
            return null;
        }
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(GEOCODE_URL)
                    .queryParam("address", query.trim())
                    .queryParam("key", apiKey)
                    .build()
                    .encode()
                    .toUri();

            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode first = root.path("results").path(0);
            JsonNode loc = first.path("geometry").path("location");
            if (loc.path("lat").isMissingNode()) {
                return null;
            }
            double lat = loc.path("lat").asDouble();
            double lng = loc.path("lng").asDouble();
            String label = first.path("formatted_address").asText(query.trim());
            return new GeocodeDto(lat, lng, label.isBlank() ? query.trim() : label);
        } catch (HttpClientErrorException e) {
            log.error("Google geocode 4xx (query={}): status={}, body={}",
                    query, e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.error("Google geocode failed (query={}): {}", query, e.getMessage());
            return null;
        }
    }

    /** locationBias/locationRestriction 공통 circle 객체. */
    private Map<String, Object> circle(double lat, double lng, int radius) {
        int safeRadius = Math.min(Math.max(radius, 1), MAX_RADIUS);
        return Map.of("circle", Map.of(
                "center", Map.of("latitude", lat, "longitude", lng),
                "radius", (double) safeRadius
        ));
    }

    private List<HospitalDto> searchPlaces(String url, Map<String, Object> body, double centerLat, double centerLng) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Goog-Api-Key", apiKey);
            headers.set("X-Goog-FieldMask", FIELD_MASK);

            String json = objectMapper.writeValueAsString(body);
            ResponseEntity<String> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(json, headers), String.class);

            return parsePlaces(response.getBody(), centerLat, centerLng);
        } catch (HttpClientErrorException e) {
            log.error("Google Places 4xx (url={}, lat={}, lng={}): status={}, body={}",
                    url, centerLat, centerLng, e.getStatusCode(), e.getResponseBodyAsString());
            return List.of();
        } catch (Exception e) {
            log.error("Google Places call failed (url={}, lat={}, lng={}): {}",
                    url, centerLat, centerLng, e.getMessage());
            return List.of();
        }
    }

    private List<HospitalDto> parsePlaces(String responseBody, double centerLat, double centerLng) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode places = root.path("places");
        List<HospitalDto> result = new ArrayList<>();
        for (JsonNode p : places) {
            double lat = p.path("location").path("latitude").asDouble();
            double lng = p.path("location").path("longitude").asDouble();
            // Google 은 거리값을 안 주므로 검색 중심으로부터 직선거리(Haversine) 를 직접 계산.
            int distance = (int) Math.round(haversineMeters(centerLat, centerLng, lat, lng));
            result.add(new HospitalDto(
                    p.path("id").asText(),
                    p.path("displayName").path("text").asText(),
                    p.path("formattedAddress").asText(),
                    "", // 전화번호는 Enterprise SKU — 상세 페이지(placeUrl)에서 확인하도록 비움
                    lat,
                    lng,
                    distance,
                    p.path("googleMapsUri").asText()
            ));
        }
        result.sort(Comparator.comparingInt(HospitalDto::distance));
        return result;
    }

    private static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double r = 6371000; // 지구 반지름 (m)
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * r * Math.asin(Math.sqrt(a));
    }
}
