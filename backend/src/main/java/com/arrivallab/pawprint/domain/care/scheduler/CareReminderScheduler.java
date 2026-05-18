package com.arrivallab.pawprint.domain.care.scheduler;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import com.arrivallab.pawprint.domain.care.entity.CareItemType;
import com.arrivallab.pawprint.domain.care.repository.CareItemRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.infra.fcm.FcmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 매분 0초마다 실행 — 현재 시각과 일치하는 reminderTime 의 케어 항목들을 push 알림.
 * 서버 타임존: Asia/Seoul (사용자 대부분 한국). 다른 타임존 사용자 지원은 추후.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CareReminderScheduler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private static final Map<CareItemType, String> TYPE_PREFIX = Map.of(
            CareItemType.MEAL, "🥣",
            CareItemType.SNACK, "🍪",
            CareItemType.SUPPLEMENT, "💊",
            CareItemType.WALK, "🚶",
            CareItemType.BRUSH, "🪥",
            CareItemType.MEDICATION, "💊",
            CareItemType.CUSTOM, "✓"
    );

    private final CareItemRepository careItemRepository;
    private final ShareMemberRepository shareMemberRepository;
    private final FcmService fcmService;

    /** 매분 0초에 실행. 현재 분의 [HH:mm:00, HH:mm+1:00) 범위 알림 발송. */
    @Scheduled(cron = "0 * * * * *", zone = "Asia/Seoul")
    @Transactional(readOnly = true)
    public void sendReminders() {
        LocalTime now = LocalTime.now(KST).withSecond(0).withNano(0);
        LocalTime next = now.plusMinutes(1);
        // 자정 wrap-around 무시 — 23:59 알림은 LocalTime.MAX 까지 범위로 잡힘.
        List<CareItem> due = careItemRepository.findActiveByReminderWindow(now, next);
        if (due.isEmpty()) return;

        String today = java.time.LocalDate.now(KST).toString();
        log.info("CareReminder: {} items due at {}", due.size(), now);
        for (CareItem item : due) {
            Pet pet = item.getPet();
            String prefix = TYPE_PREFIX.getOrDefault(item.getItemType(), "✓");
            String title = String.format("%s %s · %s", prefix, pet.getName(), item.getName());
            String body = "케어 시간이에요";
            Map<String, Object> data = Map.of(
                    "type", "CARE_REMINDER",
                    "petId", pet.getId(),
                    "itemId", item.getId(),
                    "date", today
            );

            List<User> recipients = new ArrayList<>();
            recipients.add(pet.getUser());
            shareMemberRepository.findByPetIdAndStatus(pet.getId(), ShareStatus.ACCEPTED)
                    .forEach(sm -> recipients.add(sm.getMember()));

            for (User u : recipients) {
                String token = u.getFcmToken();
                if (token == null || token.isBlank()) {
                    log.warn("CareReminder skip: userId={} email={} pet={} item={} — fcmToken null/blank",
                            u.getId(), u.getEmail(), pet.getName(), item.getName());
                    continue;
                }
                log.info("CareReminder dispatch: userId={} email={} pet={} item={} tokenLen={}",
                        u.getId(), u.getEmail(), pet.getName(), item.getName(), token.length());
                fcmService.sendPushNotification(token, title, body, data, "CARE_REMINDER");
            }
        }
    }
}
