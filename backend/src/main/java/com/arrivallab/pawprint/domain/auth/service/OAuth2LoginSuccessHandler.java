package com.arrivallab.pawprint.domain.auth.service;

import com.arrivallab.pawprint.domain.auth.dto.AuthResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private static final String APP_SCHEME = "pawprint://auth";

    private final AuthService authService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OidcUser oidcUser = (OidcUser) authentication.getPrincipal();

        String email = oidcUser.getEmail();
        String name = oidcUser.getFullName() != null ? oidcUser.getFullName() : "Google User";
        String profileImage = oidcUser.getPicture();
        String providerId = oidcUser.getSubject();

        // Spring Security OAuth flow 에는 X-Device-Id 헤더가 직접 들어오기 어려움 (브라우저 redirect).
        // 첫 발급은 deviceId=null 로 두고 frontend 가 첫 refresh 호출 시 deviceId 전달 → 그때부터
        // 토큰이 디바이스에 묶임. 다음 같은 디바이스 OAuth 부터는 deleteByUserAndDeviceId 가 정상 작동.
        AuthResponse authResponse = authService.googleLoginWithInfo(email, name, profileImage, providerId, null);

        String redirectUrl = APP_SCHEME
                + "?access_token=" + URLEncoder.encode(authResponse.accessToken(), StandardCharsets.UTF_8)
                + "&refresh_token=" + URLEncoder.encode(authResponse.refreshToken(), StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
