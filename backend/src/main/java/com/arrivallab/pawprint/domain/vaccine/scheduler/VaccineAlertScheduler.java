package com.arrivallab.pawprint.domain.vaccine.scheduler;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.vaccine.entity.RecurrenceType;
import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;
import com.arrivallab.pawprint.domain.vaccine.repository.VaccineRepository;
import com.arrivallab.pawprint.global.notification.PushNotificationPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class VaccineAlertScheduler {

    private final VaccineRepository vaccineRepository;
    private final ShareMemberRepository shareMemberRepository;
    private final PushNotificationPort pushNotificationPort;

    /**
     * 매일 09:00 KST 알림 발송. D-0/D-1/D-3/D-7 대상 백신·정기약 항목.
     * D-0 항목이 반복(NONE 아님)이면 알림 후 next_vaccine_at 을 다음 주기로 자동 roll-forward → 다음 달도 자동 알림.
     * write 가 섞여 있어 read-only transaction 제거.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendVaccineAlerts() {
        LocalDate today = LocalDate.now();
        int[] offsets = {0, 1, 3, 7};
        for (int offset : offsets) {
            LocalDate targetDate = today.plusDays(offset);
            List<Vaccine> vaccines = vaccineRepository.findAlertableByNextVaccineAt(targetDate);
            for (Vaccine v : vaccines) {
                Pet pet = v.getPet();
                String title = pet.getName() + buildTitleSuffix(v.getRecurrenceType());
                String body = buildBody(v.getVaccineName(), offset, v.getRecurrenceType());

                List<User> recipients = new ArrayList<>();
                recipients.add(pet.getUser());
                shareMemberRepository.findByPetIdAndStatus(pet.getId(), ShareStatus.ACCEPTED)
                        .forEach(sm -> recipients.add(sm.getMember()));

                for (User u : recipients) {
                    String token = u.getFcmToken();
                    if (token == null || token.isBlank()) {
                        log.warn("VaccineAlert skip: userId={} email={} pet={} vaccine={} — fcmToken null/blank",
                                u.getId(), u.getEmail(), pet.getName(), v.getVaccineName());
                        continue;
                    }
                    log.info("VaccineAlert dispatch: userId={} email={} pet={} vaccine={} recurrence={} dDay={} tokenLen={}",
                            u.getId(), u.getEmail(), pet.getName(), v.getVaccineName(),
                            v.getRecurrenceType(), offset, token.length());
                    pushNotificationPort.send(token, title, body);
                }

                // D-0 + 반복 항목 — 알림 발송 후 다음 일정 자동 갱신.
                // 단발은 사용자가 직접 다음 일정 등록(또는 alertEnabled off).
                if (offset == 0 && v.getRecurrenceType() != null
                        && v.getRecurrenceType() != RecurrenceType.NONE) {
                    v.rollForwardForRecurrence();
                }
            }
        }
    }

    private String buildTitleSuffix(RecurrenceType type) {
        if (type == null || type == RecurrenceType.NONE) return "의 예방접종 알림";
        return "의 정기 케어 알림";
    }

    private String buildBody(String vaccineName, int offset, RecurrenceType type) {
        String when = switch (offset) {
            case 0 -> "오늘입니다.";
            case 1 -> "내일입니다.";
            default -> offset + "일 후입니다.";
        };
        String prefix = (type == null || type == RecurrenceType.NONE) ? " 접종일이 " : " 일정이 ";
        return vaccineName + prefix + when;
    }
}
