package com.arrivallab.pawprint.domain.symptom.service;

import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckRequest;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckResponse;
import com.arrivallab.pawprint.domain.symptom.entity.SymptomCheckUsage;
import com.arrivallab.pawprint.domain.symptom.repository.SymptomCheckUsageRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.infra.ai.GeminiSymptomService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AI 증상 체크 월 한도도 KST 기준으로 집계해야 한다 (OcrUsageService 와 동일 원칙).
 */
@ExtendWith(MockitoExtension.class)
class SymptomCheckServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PetRepository petRepository;
    @Mock private ShareMemberRepository shareMemberRepository;
    @Mock private SymptomCheckUsageRepository usageRepository;
    @Mock private GeminiSymptomService geminiService;

    @Test
    @DisplayName("UTC로는 1월이지만 KST로 2월인 순간 — AI 체크 한도를 KST 기준 '2026-02'로 집계한다")
    void monthlyAiQuota_bucketsByKst() {
        Clock clock = Clock.fixed(Instant.parse("2026-01-31T23:30:00Z"), ZoneOffset.UTC);
        SymptomCheckService service = new SymptomCheckService(
                userRepository, petRepository, shareMemberRepository, usageRepository, geminiService, clock);

        User user = User.builder().id(1L).subscriptionType(SubscriptionType.FREE).build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(usageRepository.countByUserAndYearMonth(user, "2026-02")).thenReturn(0L);
        SymptomCheckResponse dummy = new SymptomCheckResponse(
                SymptomCheckResponse.Urgency.OBSERVE, "reason", List.of(), List.of(),
                null, "disclaimer", null, List.of());
        when(geminiService.check(any(), any(), any(), any(), any())).thenReturn(dummy);

        service.check(1L, new SymptomCheckRequest(null, "기침을 해요", null, null, true));

        verify(usageRepository).countByUserAndYearMonth(user, "2026-02");
        ArgumentCaptor<SymptomCheckUsage> saved = ArgumentCaptor.forClass(SymptomCheckUsage.class);
        verify(usageRepository).save(saved.capture());
        assertThat(saved.getValue().getYearMonth()).isEqualTo("2026-02");
    }
}
