package com.arrivallab.pawprint.domain.record.service;

import com.arrivallab.pawprint.domain.record.dto.MedicalRecordOcrResponse;
import com.arrivallab.pawprint.domain.record.entity.OcrUsage;
import com.arrivallab.pawprint.domain.record.repository.OcrUsageRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.constants.SubscriptionLimits;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.infra.ai.GeminiAudioService;
import com.arrivallab.pawprint.infra.ocr.GeminiOcrService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Clock;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Gemini OCR/Audio 호출 + FREE 등급 월간 사용량 한도 체크.
 * OCR 와 Audio 는 같은 한도(MAX_OCR_PER_MONTH) 공유 — 둘 다 비용 동등한 Gemini API 호출.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class OcrUsageService {

    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");
    /** 월 한도는 한국 기준 달로 집계 — 서버 기본 타임존(UTC)에 끌려가지 않도록. */
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final OcrUsageRepository ocrUsageRepository;
    private final UserRepository userRepository;
    private final GeminiOcrService geminiOcrService;
    private final GeminiAudioService geminiAudioService;
    private final Clock clock;

    private String currentYearMonth() {
        return YearMonth.now(clock.withZone(KST)).format(YEAR_MONTH_FMT);
    }

    public MedicalRecordOcrResponse parseImage(Long userId, MultipartFile file) {
        User user = checkLimitAndGetUser(userId);
        MedicalRecordOcrResponse result = geminiOcrService.parseImage(file);
        recordUsage(user);
        return result;
    }

    /** 음성 녹음 → Gemini → 진료기록 prefill. OCR과 동일한 월별 한도 공유. */
    public MedicalRecordOcrResponse parseAudio(Long userId, MultipartFile file) {
        User user = checkLimitAndGetUser(userId);
        MedicalRecordOcrResponse result = geminiAudioService.parseAudio(file);
        recordUsage(user);
        return result;
    }

    private User checkLimitAndGetUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        String yearMonth = currentYearMonth();
        if (ocrUsageRepository.countByUserAndYearMonth(user, yearMonth) >= SubscriptionLimits.of(user.getSubscriptionType()).maxOcrPerMonth()) {
            throw new BusinessException(ErrorCode.OCR_LIMIT_EXCEEDED);
        }
        return user;
    }

    private void recordUsage(User user) {
        ocrUsageRepository.save(OcrUsage.builder()
                .user(user)
                .yearMonth(currentYearMonth())
                .build());
    }
}
