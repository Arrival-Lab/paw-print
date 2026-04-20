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
        if (kakaoApiKey.isBlank()) {
            log.warn("Kakao API key not configured");
            return List.of();
        }
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(KAKAO_KEYWORD_URL)
                    .queryParam("query", "24시간 동물병원")
                    .queryParam("x", lng)
                    .queryParam("y", lat)
                    .queryParam("radius", radius)
                    .queryParam("size", 15)
                    .build().toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoApiKey);
            ResponseEntity<String> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), String.class);

            return parseHospitals(response.getBody());
        } catch (Exception e) {
            log.error("Kakao API call failed: {}", e.getMessage());
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
