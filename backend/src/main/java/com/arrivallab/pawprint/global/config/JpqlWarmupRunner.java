package com.arrivallab.pawprint.global.config;

import com.arrivallab.pawprint.domain.appointment.repository.AppointmentRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 핫패스 JPQL prepared statement 사전 컴파일.
 *
 * prod 환경(spring.main.lazy-initialization: true) 에서 첫 로그인 직후
 * /api/appointments/upcoming 가 bean 초기화 + JPQL 컴파일로 수십 초 멈춰
 * 프론트 axios timeout 까지 hang 되는 사례 대응. sentinel userId(0L) 로
 * 한 번 돌려 비용을 startup 으로 옮김 — 결과는 비어 있어도 prepared
 * statement 캐시는 채워짐.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JpqlWarmupRunner {

    private final AppointmentRepository appointmentRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void warmUp() {
        long start = System.currentTimeMillis();
        try {
            LocalDateTime now = LocalDateTime.now();
            appointmentRepository.findUpcomingByUserId(0L, ShareStatus.ACCEPTED, now, now.plusDays(30));
            log.info("JpqlWarmupRunner: completed in {}ms", System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.warn("JpqlWarmupRunner: failed (non-fatal)", e);
        }
    }
}
