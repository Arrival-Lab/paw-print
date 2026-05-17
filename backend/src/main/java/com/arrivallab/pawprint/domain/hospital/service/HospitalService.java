package com.arrivallab.pawprint.domain.hospital.service;

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
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HospitalService {

    private static final String KAKAO_KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

    @Value("${kakao.api-key:}")
    private String kakaoApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public List<HospitalDto> findEmergencyHospitals(double lat, double lng, int radius) {
        return searchKakaoKeyword(lat, lng, radius, "24시간 동물병원");
    }

    /** 일반 동물병원 — emergency 외 다른 진입에서 사용. 키워드만 다르고 나머지 동일. */
    public List<HospitalDto> findHospitals(double lat, double lng, int radius) {
        return searchKakaoKeyword(lat, lng, radius, "동물병원");
    }

    private List<HospitalDto> searchKakaoKeyword(double lat, double lng, int radius, String query) {
        if (kakaoApiKey.isBlank()) {
            log.warn("Kakao API key not configured");
            return List.of();
        }
        // 한국 좌표 범위 가드 — 프론트 GPS 권한 거부 시 (0,0) 같은 좌표가 들어와 카카오에서 400 발생.
        if (lat < 33.0 || lat > 39.0 || lng < 124.0 || lng > 132.0) {
            log.warn("Kakao API skipped — 좌표가 한국 범위 밖: lat={}, lng={}", lat, lng);
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
                    (int) doc.path("distance").asDouble()
            ));
        }
        result.sort(Comparator.comparingInt(HospitalDto::distance));
        return result;
    }
}
