package com.arrivallab.pawprint.infra.fcm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Expo Push API 클라이언트.
 * 클래스명은 호출 측 호환성 유지 위해 유지 — 실제로는 Firebase 가 아닌 Expo Push Service 사용.
 * iOS/Android 모두 ExponentPushToken[...] 단일 형식. Expo 가 내부적으로 APNs/FCM 분배.
 */
@Slf4j
@Service
public class FcmService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.builder()
            .baseUrl(EXPO_PUSH_URL)
            .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("Accept-Encoding", "gzip, deflate")
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();

    public void sendPushNotification(String token, String title, String body) {
        if (token == null || token.isBlank()) {
            log.warn("Push skip: token missing (title={})", title);
            return;
        }
        String tokenPreview = token.length() > 24 ? token.substring(0, 24) + "..." : token;
        try {
            Map<String, Object> payload = Map.of(
                    "to", token,
                    "title", title,
                    "body", body,
                    "sound", "default"
            );
            Map<?, ?> response = restClient.post()
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
            log.info("Push sent: title={} token={} response={}", title, tokenPreview, response);
        } catch (Exception e) {
            log.error("Push send failed: title={} token={} error={}", title, tokenPreview, e.getMessage());
        }
    }
}
