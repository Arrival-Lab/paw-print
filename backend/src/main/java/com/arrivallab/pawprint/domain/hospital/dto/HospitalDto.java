package com.arrivallab.pawprint.domain.hospital.dto;

public record HospitalDto(
        String id,
        String name,
        String address,
        String phone,
        double lat,
        double lng,
        int distance,
        /** 카카오맵 장소 상세 페이지 URL — 진료시간·실시간 영업 여부는 여기서 확인. */
        String placeUrl
) {}
