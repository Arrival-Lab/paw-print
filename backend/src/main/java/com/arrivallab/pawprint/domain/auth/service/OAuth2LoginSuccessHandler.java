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

        AuthResponse authResponse = authService.googleLoginWithInfo(email, name, profileImage, providerId);

        String redirectUrl = APP_SCHEME
                + "?access_token=" + URLEncoder.encode(authResponse.accessToken(), StandardCharsets.UTF_8)
                + "&refresh_token=" + URLEncoder.encode(authResponse.refreshToken(), StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}
