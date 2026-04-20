package com.arrivallab.pawprint.domain.vaccine.scheduler;

import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;
import com.arrivallab.pawprint.domain.vaccine.repository.VaccineRepository;
import com.arrivallab.pawprint.infra.fcm.FcmService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class VaccineAlertScheduler {

    private final VaccineRepository vaccineRepository;
    private final FcmService fcmService;

    @Scheduled(cron = "0 0 9 * * *")
    @Transactional(readOnly = true)
    public void sendVaccineAlerts() {
        LocalDate today = LocalDate.now();
        int[] offsets = {0, 1, 3, 7};
        for (int offset : offsets) {
            LocalDate targetDate = today.plusDays(offset);
            List<Vaccine> vaccines = vaccineRepository.findAlertableByNextVaccineAt(targetDate);
            for (Vaccine v : vaccines) {
                String fcmToken = v.getPet().getUser().getFcmToken();
                String petName = v.getPet().getName();
                String title = petName + "의 예방접종 알림";
                String body = buildBody(v.getVaccineName(), offset);
                fcmService.sendPushNotification(fcmToken, title, body);
                log.debug("Vaccine alert sent: pet={}, vaccine={}, dDay={}", petName, v.getVaccineName(), offset);
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
