package com.arrivallab.pawprint.domain.care.scheduler;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import com.arrivallab.pawprint.domain.care.entity.CareItemType;
import com.arrivallab.pawprint.domain.care.repository.CareItemRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.notification.PushNotificationPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 매분 0초마다 실행 — 현재 시각과 일치하는 reminderTime 의 케어 항목들을 push 알림.
 * 펫 소유자의 User.timezone 기준 로컬 시각으로 판단 (소유자가 설정한 시간이므로 소유자 기준이 맞음).
 * 사용 중인 타임존 종류만큼 반복 — 사용자 수가 아니라 타임존 수에 비례.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CareReminderScheduler {

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
    private final UserRepository userRepository;
    private final PushNotificationPort pushNotificationPort;

    /** 매분 0초에 실행. 서버 zone 은 무관 — 타임존별 로컬 시각은 내부에서 직접 계산. */
    @Scheduled(cron = "0 * * * * *")
    @Transactional(readOnly = true)
    public void sendReminders() {
        for (String tz : userRepository.findDistinctTimezones()) {
            try {
                sendRemindersForTimezone(ZoneId.of(tz));
            } catch (DateTimeException e) {
                log.warn("CareReminder skip: invalid timezone={}", tz);
            }
        }
    }

    private void sendRemindersForTimezone(ZoneId zone) {
        LocalTime now = LocalTime.now(zone).withSecond(0).withNano(0);
        LocalTime next = now.plusMinutes(1);
        LocalDate today = LocalDate.now(zone);
        // 자정 wrap-around 무시 — 23:59 알림은 LocalTime.MAX 까지 범위로 잡힘.
        List<CareItem> due = careItemRepository.findActiveByReminderWindow(today, now, next, zone.getId());
        if (due.isEmpty()) return;

        String todayStr = today.toString();
        log.debug("CareReminder: {} items due at {} ({})", due.size(), now, zone);
        for (CareItem item : due) {
            Pet pet = item.getPet();
            String prefix = TYPE_PREFIX.getOrDefault(item.getItemType(), "✓");
            String title = String.format("%s %s · %s", prefix, pet.getName(), item.getName());
            String body = "케어 시간이에요";
            Map<String, Object> data = Map.of(
                    "type", "CARE_REMINDER",
                    "petId", pet.getId(),
                    "itemId", item.getId(),
                    "date", todayStr
            );

            List<User> recipients = new ArrayList<>();
            recipients.add(pet.getUser());
            shareMemberRepository.findByPetIdAndStatus(pet.getId(), ShareStatus.ACCEPTED)
                    .forEach(sm -> recipients.add(sm.getMember()));

            for (User u : recipients) {
                if (Boolean.FALSE.equals(u.getNotifyCare())) {
                    log.debug("CareReminder skip: userId={} — notifyCare=false", u.getId());
                    continue;
                }
                String token = u.getFcmToken();
                if (token == null || token.isBlank()) {
                    log.debug("CareReminder skip: userId={} — fcmToken null/blank", u.getId());
                    continue;
                }
                log.debug("CareReminder dispatch: userId={} item={}", u.getId(), item.getName());
                pushNotificationPort.send(token, title, body, data, "CARE_REMINDER");
            }
        }
    }
}
