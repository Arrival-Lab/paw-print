package com.arrivallab.pawprint.domain.auth.service;

import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class GoogleAuthService {

    @Value("${google.client-id:}")
    private String googleClientId;

    private final RestTemplate restTemplate = new RestTemplate();

    public GoogleUserInfo verify(String idToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.getForObject(url, Map.class);
            if (body == null) throw new BusinessException(ErrorCode.INVALID_TOKEN);

            if (!googleClientId.isBlank()) {
                String aud = (String) body.get("aud");
                if (!googleClientId.equals(aud)) throw new BusinessException(ErrorCode.INVALID_TOKEN);
            }

            String email = (String) body.get("email");
            String name = (String) body.getOrDefault("name", "Google User");
            String profileImage = (String) body.get("picture");
            String providerId = (String) body.get("sub");

            if (email == null || providerId == null) throw new BusinessException(ErrorCode.INVALID_TOKEN);

            return new GoogleUserInfo(email, name != null ? name : "Google User", profileImage, providerId);
        } catch (HttpClientErrorException e) {
            log.debug("Google tokeninfo failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
    }

    public record GoogleUserInfo(String email, String name, String profileImage, String providerId) {}
}
