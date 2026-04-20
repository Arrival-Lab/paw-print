package com.arrivallab.pawprint.domain.auth.service;

import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppleAuthService {

    private static final String APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    public AppleUserInfo verify(String identityToken) {
        try {
            String[] parts = identityToken.split("\\.");
            if (parts.length != 3) throw new BusinessException(ErrorCode.INVALID_TOKEN);

            byte[] headerBytes = Base64.getUrlDecoder().decode(padBase64(parts[0]));
            JsonNode header = objectMapper.readTree(headerBytes);
            String kid = header.get("kid").asText();

            @SuppressWarnings("unchecked")
            Map<String, Object> keysResponse = restTemplate.getForObject(APPLE_KEYS_URL, Map.class);
            if (keysResponse == null) throw new BusinessException(ErrorCode.INVALID_TOKEN);

            @SuppressWarnings("unchecked")
            List<Map<String, String>> keys = (List<Map<String, String>>) keysResponse.get("keys");

            Map<String, String> matchingKey = keys.stream()
                    .filter(k -> kid.equals(k.get("kid")))
                    .findFirst()
                    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_TOKEN));

            PublicKey publicKey = buildRsaPublicKey(matchingKey.get("n"), matchingKey.get("e"));

            Claims claims = Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(identityToken)
                    .getPayload();

            String sub = claims.getSubject();
            String email = claims.get("email", String.class);

            return new AppleUserInfo(sub, email);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Apple token verification failed: {}", e.getMessage());
            throw new BusinessException(ErrorCode.INVALID_TOKEN);
        }
    }

    private PublicKey buildRsaPublicKey(String nStr, String eStr) throws Exception {
        BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(padBase64(nStr)));
        BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(padBase64(eStr)));
        RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
        return KeyFactory.getInstance("RSA").generatePublic(spec);
    }

    private String padBase64(String base64Url) {
        int mod = base64Url.length() % 4;
        return mod == 0 ? base64Url : base64Url + "=".repeat(4 - mod);
    }

    public record AppleUserInfo(String sub, String email) {}
}
