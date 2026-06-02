package com.arrivallab.pawprint.domain.hospital.dto;

/**
 * 지역/장소 검색어를 좌표로 변환한 결과.
 * 프론트 병원 찾기 지도에서 "강남역", "부산" 같은 검색어를 지도 중심으로 이동시킬 때 사용.
 */
public record GeocodeDto(
        double lat,
        double lng,
        String label
) {
}
