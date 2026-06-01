package com.arrivallab.pawprint.domain.user.dto;

import com.arrivallab.pawprint.domain.user.entity.User;

/**
 * 사용자 알림 카테고리 on/off 상태. GET/PATCH 응답·요청 공통.
 * PATCH 시 필드를 null 로 보내면 그 카테고리는 변경하지 않음.
 */
public record NotificationPreferencesDto(
        Boolean notifyVaccine,
        Boolean notifyCare
) {
    public static NotificationPreferencesDto from(User user) {
        return new NotificationPreferencesDto(user.getNotifyVaccine(), user.getNotifyCare());
    }
}
