package com.arrivallab.pawprint.domain.hospital.provider;

import com.arrivallab.pawprint.domain.hospital.dto.GeocodeDto;
import com.arrivallab.pawprint.domain.hospital.dto.HospitalDto;

import java.util.List;

/**
 * 동물병원 검색 프로바이더. 좌표가 한국이면 {@link KakaoHospitalProvider},
 * 한국 밖이면 {@link GoogleHospitalProvider} 가 사용된다 ({@code HospitalService} 가 라우팅).
 * 글로벌화 이후 Kakao Local API 가 한국 좌표만 지원하는 한계를 우회하기 위한 추상화.
 */
public interface HospitalProvider {

    /** 응급/24시 동물병원 검색. */
    List<HospitalDto> findEmergencyHospitals(double lat, double lng, int radius);

    /** 일반 동물병원 검색. */
    List<HospitalDto> findHospitals(double lat, double lng, int radius);

    /**
     * 지역/장소 검색어 → 좌표. biasLat/biasLng 는 결과를 현재 지도 중심 근처로 편향시키는 힌트
     * (null 이면 편향 없음). 매칭 결과가 없으면 null.
     */
    GeocodeDto geocode(String query, Double biasLat, Double biasLng);
}
