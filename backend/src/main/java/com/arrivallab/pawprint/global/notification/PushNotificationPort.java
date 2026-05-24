package com.arrivallab.pawprint.global.notification;

import java.util.Map;

/**
 * Domain → Infra 의존성 역전 포트.
 * 도메인 스케줄러(CareReminder/VaccineAlert 등)가 구현체(Expo/FCM)를 직접 참조하지 않도록 추상화.
 * 실제 구현은 infra/fcm/FcmService — Expo Push API 클라이언트.
 */
public interface PushNotificationPort {

    /** title/body 만 보내는 간이 호출. */
    void send(String token, String title, String body);

    /**
     * @param data 알림 tap/action 처리 시 클라이언트가 읽을 메타데이터
     * @param categoryId iOS notification category (action button 그룹) — 미사용 시 null
     */
    void send(String token, String title, String body,
              Map<String, Object> data, String categoryId);
}
