package com.arrivallab.pawprint.infra.fcm;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FcmService {

    public void sendPushNotification(String fcmToken, String title, String body) {
        // TODO: Firebase FCM 푸시 알림 구현
        log.debug("FCM push (stub) → token={}, title={}", fcmToken, title);
    }
}
