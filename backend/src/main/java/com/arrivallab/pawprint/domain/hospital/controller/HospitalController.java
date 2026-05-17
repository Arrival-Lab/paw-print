package com.arrivallab.pawprint.domain.hospital.controller;

import com.arrivallab.pawprint.domain.hospital.dto.HospitalDto;
import com.arrivallab.pawprint.domain.hospital.service.HospitalService;
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
}
