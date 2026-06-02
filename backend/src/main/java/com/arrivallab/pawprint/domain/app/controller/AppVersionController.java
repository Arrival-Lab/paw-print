package com.arrivallab.pawprint.domain.app.controller;

import com.arrivallab.pawprint.domain.app.dto.AppVersionResponse;
import com.arrivallab.pawprint.global.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 버전 게이트. 스토어 반영 시점에 yml(또는 env) 값만 올리면 구버전 앱에 업데이트 모달이 뜬다.
 * 인증 불필요(로그인 전 호출). SecurityConfig 에서 /api/app/** GET permitAll.
 */
@RestController
@RequestMapping("/api/app")
public class AppVersionController {

    @Value("${app.version.android.latest:1.0.1}")
    private String androidLatest;
    @Value("${app.version.android.min:1.0.0}")
    private String androidMin;
    @Value("${app.version.ios.latest:1.0.1}")
    private String iosLatest;
    @Value("${app.version.ios.min:1.0.0}")
    private String iosMin;

    @GetMapping("/version")
    public ResponseEntity<ApiResponse<AppVersionResponse>> version(
            @RequestParam(defaultValue = "android") String platform) {
        boolean ios = "ios".equalsIgnoreCase(platform);
        return ApiResponse.ok(new AppVersionResponse(
                ios ? iosLatest : androidLatest,
                ios ? iosMin : androidMin));
    }
}
