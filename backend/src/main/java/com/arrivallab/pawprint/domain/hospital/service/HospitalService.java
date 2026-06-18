package com.arrivallab.pawprint.domain.hospital.service;

import com.arrivallab.pawprint.domain.hospital.dto.GeocodeDto;
import com.arrivallab.pawprint.domain.hospital.dto.HospitalDto;
import com.arrivallab.pawprint.domain.hospital.provider.GoogleHospitalProvider;
import com.arrivallab.pawprint.domain.hospital.provider.HospitalProvider;
import com.arrivallab.pawprint.domain.hospital.provider.KakaoHospitalProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 동물병원 검색 라우터 — 좌표가 한국이면 Kakao, 한국 밖이면 Google 프로바이더로 위임.
 * 글로벌화 이후 해외 좌표에서도 병원찾기가 동작하도록 리전별 프로바이더를 분기한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HospitalService {

    private final KakaoHospitalProvider kakaoProvider;
    private final GoogleHospitalProvider googleProvider;

    /** 한국 본토 + 제주 + 인근 도서를 포함하는 대략적 bbox. */
    static boolean isKorea(double lat, double lng) {
        return lat >= 33.0 && lat <= 39.0 && lng >= 124.0 && lng <= 132.0;
    }

    /** GPS 권한 거부 시 들어오는 (0,0) 같은 무의미한 좌표 방어. */
    private static boolean isValidCoord(double lat, double lng) {
        return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
                && !(Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01);
    }

    private HospitalProvider providerFor(double lat, double lng) {
        return isKorea(lat, lng) ? kakaoProvider : googleProvider;
    }

    public List<HospitalDto> findEmergencyHospitals(double lat, double lng, int radius) {
        if (!isValidCoord(lat, lng)) {
            log.warn("동물병원 검색 스킵 — 유효하지 않은 좌표: lat={}, lng={}", lat, lng);
            return List.of();
        }
        return providerFor(lat, lng).findEmergencyHospitals(lat, lng, radius);
    }

    public List<HospitalDto> findHospitals(double lat, double lng, int radius) {
        if (!isValidCoord(lat, lng)) {
            log.warn("동물병원 검색 스킵 — 유효하지 않은 좌표: lat={}, lng={}", lat, lng);
            return List.of();
        }
        return providerFor(lat, lng).findHospitals(lat, lng, radius);
    }

    /**
     * 지역/장소 검색어 → 좌표. biasLat/biasLng(현재 지도 중심)로 프로바이더를 결정한다.
     * 좌표가 없으면(=구버전 클라이언트) 한국으로 간주해 Kakao 로 폴백.
     */
    public GeocodeDto geocode(String query, Double biasLat, Double biasLng) {
        boolean korea = biasLat == null || biasLng == null || isKorea(biasLat, biasLng);
        HospitalProvider provider = korea ? kakaoProvider : googleProvider;
        return provider.geocode(query, biasLat, biasLng);
    }
}
