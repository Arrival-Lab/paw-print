package com.arrivallab.pawprint.domain.hospital.dto;

public record HospitalDto(
        String id,
        String name,
        String address,
        String phone,
        double lat,
        double lng,
        int distance
) {}
