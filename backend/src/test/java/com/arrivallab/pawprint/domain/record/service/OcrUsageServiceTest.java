package com.arrivallab.pawprint.domain.record.service;

import com.arrivallab.pawprint.domain.record.entity.OcrUsage;
import com.arrivallab.pawprint.domain.record.repository.OcrUsageRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.infra.ai.GeminiAudioService;
import com.arrivallab.pawprint.infra.ocr.GeminiOcrService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 월간 사용량 한도는 한국(KST) 기준 달로 집계해야 한다 — 서버 기본 타임존(UTC)에 끌려가면 안 됨.
 */
@ExtendWith(MockitoExtension.class)
class OcrUsageServiceTest {

    @Mock private OcrUsageRepository ocrUsageRepository;
    @Mock private UserRepository userRepository;
    @Mock private GeminiOcrService geminiOcrService;
    @Mock private GeminiAudioService geminiAudioService;

    @Test
    @DisplayName("UTC로는 아직 1월이지만 KST로 2월인 순간 — 한도는 KST 기준 '2026-02'로 집계한다")
    void monthlyQuota_bucketsByKst_notServerDefault() {
        // 2026-01-31 23:30 UTC == 2026-02-01 08:30 Asia/Seoul → 한국 기준 2월
        Clock clock = Clock.fixed(Instant.parse("2026-01-31T23:30:00Z"), ZoneOffset.UTC);
        OcrUsageService service = new OcrUsageService(
                ocrUsageRepository, userRepository, geminiOcrService, geminiAudioService, clock);

        User user = User.builder().id(1L).subscriptionType(SubscriptionType.FREE).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(ocrUsageRepository.countByUserAndYearMonth(user, "2026-02")).thenReturn(0L);

        service.parseImage(1L, null);

        // 한도 검사도, 사용 기록 저장도 모두 KST 기준 '2026-02' 로
        verify(ocrUsageRepository).countByUserAndYearMonth(user, "2026-02");
        ArgumentCaptor<OcrUsage> saved = ArgumentCaptor.forClass(OcrUsage.class);
        verify(ocrUsageRepository).save(saved.capture());
        assertThat(saved.getValue().getYearMonth()).isEqualTo("2026-02");
    }
}
