package com.arrivallab.pawprint.infra.fcm;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FcmService {

    public void sendPushNotification(String fcmToken, String title, String body) {
        if (fcmToken == null || fcmToken.isBlank()) {
            log.warn("FCM skip: token missing (title={})", title);
            return;
        }
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("FCM skip: Firebase not initialized (title={})", title);
            return;
        }
        String tokenPreview = fcmToken.length() > 12 ? fcmToken.substring(0, 12) + "..." : fcmToken;
        try {
            Message message = Message.builder()
                    .setToken(fcmToken)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .build();
            String response = FirebaseMessaging.getInstance().send(message);
            log.info("FCM sent: title={} token={} response={}", title, tokenPreview, response);
        } catch (Exception e) {
            log.error("FCM send failed: title={} token={} error={}", title, tokenPreview, e.getMessage());
        }
    }
}
