package com.arrivallab.pawprint.infra.fcm;

import com.arrivallab.pawprint.global.notification.PushNotificationPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * Expo Push API 클라이언트 — {@link PushNotificationPort} 의 infra 어댑터.
 * 클래스명은 호출 측 호환성 유지 위해 유지 — 실제로는 Firebase 가 아닌 Expo Push Service 사용.
 * iOS/Android 모두 ExponentPushToken[...] 단일 형식. Expo 가 내부적으로 APNs/FCM 분배.
 */
@Slf4j
@Service
public class FcmService implements PushNotificationPort {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.builder()
            .baseUrl(EXPO_PUSH_URL)
            .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
            .defaultHeader("Accept-Encoding", "gzip, deflate")
            .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .build();

    @Override
    public void send(String token, String title, String body) {
        send(token, title, body, null, null);
    }

    @Override
    public void send(String token, String title, String body,
                     Map<String, Object> data, String categoryId) {
        if (token == null || token.isBlank()) {
            log.warn("Push skip: token missing (title={})", title);
            return;
        }
        String tokenPreview = token.length() > 24 ? token.substring(0, 24) + "..." : token;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("to", token);
            payload.put("title", title);
            payload.put("body", body);
            payload.put("sound", "default");
            if (data != null && !data.isEmpty()) payload.put("data", data);
            if (categoryId != null && !categoryId.isBlank()) payload.put("categoryId", categoryId);

            Map<?, ?> response = restClient.post()
                    .body(payload)
                    .retrieve()
                    .body(Map.class);
            log.debug("Push sent: title={} token={} response={}", title, tokenPreview, response);
        } catch (Exception e) {
            log.error("Push send failed: title={} token={} error={}", title, tokenPreview, e.getMessage());
        }
    }
}
