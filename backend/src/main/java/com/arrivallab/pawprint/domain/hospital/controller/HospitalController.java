package com.arrivallab.pawprint.domain.hospital.controller;

import com.arrivallab.pawprint.domain.hospital.dto.GeocodeDto;
import com.arrivallab.pawprint.domain.hospital.dto.HospitalDto;
import com.arrivallab.pawprint.domain.hospital.service.HospitalService;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    @GetMapping("/emergency")
    public ResponseEntity<ApiResponse<List<HospitalDto>>> findEmergency(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "5000") int radius) {
        return ApiResponse.ok(hospitalService.findEmergencyHospitals(lat, lng, radius));
    }

    /** 일반 동물병원 — '동물병원' 키워드로 검색. 응급/24시 한정 안 함. */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<HospitalDto>>> findNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "3000") int radius) {
        return ApiResponse.ok(hospitalService.findHospitals(lat, lng, radius));
    }

    /**
     * 지역/장소 검색어 → 좌표. 지도 병원 찾기에서 "강남역", "부산", "Tokyo" 등으로 지도 이동 시 사용.
     * lat/lng(현재 지도 중심)는 한국/해외 프로바이더 라우팅 + 결과 편향 힌트. 미전달 시 한국으로 폴백.
     */
    @GetMapping("/geocode")
    public ResponseEntity<ApiResponse<GeocodeDto>> geocode(
            @RequestParam String query,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        GeocodeDto result = hospitalService.geocode(query, lat, lng);
        if (result == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND);
        }
        return ApiResponse.ok(result);
    }
}
