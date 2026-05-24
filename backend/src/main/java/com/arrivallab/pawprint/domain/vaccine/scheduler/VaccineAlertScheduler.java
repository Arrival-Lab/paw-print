package com.arrivallab.pawprint.domain.vaccine.scheduler;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
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

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void sendVaccineAlerts() {
        LocalDate today = LocalDate.now();
        int[] offsets = {0, 1, 3, 7};
        for (int offset : offsets) {
            LocalDate targetDate = today.plusDays(offset);
            List<Vaccine> vaccines = vaccineRepository.findAlertableByNextVaccineAt(targetDate);
            for (Vaccine v : vaccines) {
                Pet pet = v.getPet();
                String title = pet.getName() + "의 예방접종 알림";
                String body = buildBody(v.getVaccineName(), offset);

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
                    log.info("VaccineAlert dispatch: userId={} email={} pet={} vaccine={} dDay={} tokenLen={}",
                            u.getId(), u.getEmail(), pet.getName(), v.getVaccineName(), offset, token.length());
                    pushNotificationPort.send(token, title, body);
                }
            }
        }
    }

    private String buildBody(String vaccineName, int offset) {
        return switch (offset) {
            case 0 -> vaccineName + " 접종일이 오늘입니다.";
            case 1 -> vaccineName + " 접종일이 내일입니다.";
            default -> vaccineName + " 접종일이 " + offset + "일 후입니다.";
        };
    }
}
