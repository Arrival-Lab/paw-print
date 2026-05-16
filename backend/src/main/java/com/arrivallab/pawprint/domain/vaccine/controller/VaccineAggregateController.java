package com.arrivallab.pawprint.domain.vaccine.controller;

import com.arrivallab.pawprint.domain.vaccine.dto.VaccineWithPetDto;
import com.arrivallab.pawprint.domain.vaccine.service.VaccineService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** 현재 유저의 모든 소유 펫 임박 백신 — 탭 배지·홈 위젯용. */
@RestController
@RequestMapping("/api/vaccines")
@RequiredArgsConstructor
public class VaccineAggregateController {

    private final VaccineService vaccineService;

    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<VaccineWithPetDto>>> getUpcoming(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "30") int withinDays) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(vaccineService.getUpcomingForUser(userId, withinDays));
    }
}
