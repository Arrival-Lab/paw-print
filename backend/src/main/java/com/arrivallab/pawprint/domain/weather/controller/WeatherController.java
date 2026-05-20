package com.arrivallab.pawprint.domain.weather.controller;

import com.arrivallab.pawprint.domain.weather.dto.WeatherTipResponse;
import com.arrivallab.pawprint.domain.weather.service.WeatherService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    /** 좌표 기반 날씨 + 케어 트리거. 트리거 NONE 이면 프론트가 월별팁 폴백. */
    @GetMapping("/care-tip")
    public ResponseEntity<ApiResponse<WeatherTipResponse>> getCareTip(
            @RequestParam double lat,
            @RequestParam double lng) {
        return ApiResponse.ok(weatherService.getCareTip(lat, lng));
    }
}
