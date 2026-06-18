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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * 한국 좌표 전용 — Kakao Local API 키워드/주소 검색.
 * 영업시간·전화·24시 표기 등 국내 데이터 품질이 좋아 한국 좌표는 항상 이 프로바이더가 처리한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoHospitalProvider implements HospitalProvider {

    private static final String KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
    private static final String KAKAO_ADDRESS_URL = "https://dapi.kakao.com/v2/local/search/address.json";

    @Value("${kakao.api-key:}")
    private String kakaoApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public List<HospitalDto> findEmergencyHospitals(double lat, double lng, int radius) {
        return searchKakaoKeyword(lat, lng, radius, "24시간 동물병원");
    }

    @Override
    public List<HospitalDto> findHospitals(double lat, double lng, int radius) {
        return searchKakaoKeyword(lat, lng, radius, "동물병원");
    }

    /**
     * 지역/장소 검색어 → 좌표. 키워드 검색(랜드마크·역 이름 등)을 먼저 시도하고,
     * 결과가 없으면 주소 검색("부산", "서울특별시 서초구" 등)으로 폴백.
     * biasLat/biasLng 는 Kakao 가 별도 편향을 안 써서 무시. 매칭 결과가 없으면 null.
     */
    @Override
    public GeocodeDto geocode(String query, Double biasLat, Double biasLng) {
        if (kakaoApiKey.isBlank()) {
            log.warn("Kakao API key not configured");
            return null;
        }
        if (query == null || query.isBlank()) {
            return null;
        }
        String trimmed = query.trim();

        GeocodeDto byKeyword = geocodeWith(KAKAO_KEYWORD_URL, trimmed, "place_name");
        if (byKeyword != null) {
            return byKeyword;
        }
        return geocodeWith(KAKAO_ADDRESS_URL, trimmed, "address_name");
    }

    private GeocodeDto geocodeWith(String url, String query, String labelField) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(url)
                    .queryParam("query", query)
                    .queryParam("size", 1)
                    .build()
                    .encode()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoApiKey);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode first = root.path("documents").path(0);
            if (first.isMissingNode() || first.path("x").isMissingNode()) {
                return null;
            }
            double lng = first.path("x").asDouble();
            double lat = first.path("y").asDouble();
            String label = first.path(labelField).asText(query);
            return new GeocodeDto(lat, lng, label.isBlank() ? query : label);
        } catch (HttpClientErrorException e) {
            log.error("Kakao geocode 4xx (query={}): status={}, body={}",
                    query, e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (Exception e) {
            log.error("Kakao geocode failed (query={}): {}", query, e.getMessage());
            return null;
        }
    }

    private List<HospitalDto> searchKakaoKeyword(double lat, double lng, int radius, String query) {
        if (kakaoApiKey.isBlank()) {
            log.warn("Kakao API key not configured");
            return List.of();
        }
        // 카카오 radius 허용 범위: 0~20000m. 0 도 키워드 검색에선 의미 없으니 최소 1로 clamp.
        int safeRadius = Math.min(Math.max(radius, 1), 20000);

        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(KAKAO_KEYWORD_URL)
                    .queryParam("query", query)
                    .queryParam("x", lng)
                    .queryParam("y", lat)
                    .queryParam("radius", safeRadius)
                    .queryParam("size", 15)
                    .build()
                    .encode()
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoApiKey);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            return parseHospitals(response.getBody());
        } catch (HttpClientErrorException e) {
            log.error("Kakao API 4xx (query={}, lat={}, lng={}, radius={}): status={}, body={}",
                    query, lat, lng, safeRadius, e.getStatusCode(), e.getResponseBodyAsString());
            return List.of();
        } catch (Exception e) {
            log.error("Kakao API call failed (query={}, lat={}, lng={}, radius={}): {}",
                    query, lat, lng, safeRadius, e.getMessage());
            return List.of();
        }
    }

    private List<HospitalDto> parseHospitals(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        JsonNode documents = root.path("documents");
        List<HospitalDto> result = new ArrayList<>();
        for (JsonNode doc : documents) {
            result.add(new HospitalDto(
                    doc.path("id").asText(),
                    doc.path("place_name").asText(),
                    doc.path("address_name").asText(),
                    doc.path("phone").asText(),
                    doc.path("y").asDouble(),
                    doc.path("x").asDouble(),
                    (int) doc.path("distance").asDouble(),
                    doc.path("place_url").asText()
            ));
        }
        result.sort(Comparator.comparingInt(HospitalDto::distance));
        return result;
    }
}
