package com.arrivallab.pawprint.domain.symptom.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckRequest;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckResponse;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomFollowupRequest;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomFollowupResponse;
import com.arrivallab.pawprint.domain.symptom.entity.SymptomCheckUsage;
import com.arrivallab.pawprint.domain.symptom.repository.SymptomCheckUsageRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.constants.FreeLimits;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.infra.ai.GeminiSymptomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SymptomCheckService {

    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyy-MM");

    private final UserRepository userRepository;
    private final PetRepository petRepository;
    private final ShareMemberRepository shareMemberRepository;
    private final SymptomCheckUsageRepository usageRepository;
    private final GeminiSymptomService geminiService;

    public SymptomCheckResponse check(Long userId, SymptomCheckRequest request) {
        if (!request.acknowledgedDisclaimer()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 무료 한도 체크. 응급 키워드가 감지되더라도 안전을 위해 카운트는 차감하지 않으려는 충동이 있을 수 있지만
        // 동일하게 차감 — 그래야 악용 (응급 키워드 끼워넣어 무한 사용) 차단.
        String yearMonth = YearMonth.now().format(YM);
        boolean isFree = user.getSubscriptionType() == SubscriptionType.FREE;
        long usedThisMonth = usageRepository.countByUserAndYearMonth(user, yearMonth);
        if (isFree && usedThisMonth >= FreeLimits.MAX_AI_CHECKS_PER_MONTH) {
            throw new BusinessException(ErrorCode.AI_CHECK_LIMIT_EXCEEDED);
        }

        // 펫 컨텍스트 (선택)
        String species = null;
        Integer ageYears = null;
        if (request.petId() != null) {
            Pet pet = petRepository.findById(request.petId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
            boolean isOwner = pet.getUser().getId().equals(userId);
            boolean isShared = shareMemberRepository
                    .existsByPetIdAndMemberIdAndStatus(pet.getId(), userId, ShareStatus.ACCEPTED);
            if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
            species = humanSpecies(pet);
            ageYears = pet.getBirthDate() != null
                    ? (int) java.time.Period.between(pet.getBirthDate(), LocalDate.now()).toTotalMonths() / 12
                    : null;
        }

        SymptomCheckResponse result = geminiService.check(
                species, ageYears,
                request.symptoms(), request.durationHours(), request.additionalInfo());

        usageRepository.save(SymptomCheckUsage.builder()
                .user(user).yearMonth(yearMonth).build());

        Integer remaining = isFree
                ? Math.max(0, FreeLimits.MAX_AI_CHECKS_PER_MONTH - (int) usedThisMonth - 1)
                : null;

        return new SymptomCheckResponse(
                result.urgency(), result.urgencyReason(),
                result.possibleCauses(), result.recommendedActions(),
                result.emergencyKeywordDetected(), result.disclaimer(), remaining);
    }

    /** 백엔드 history 안전망 cap — Gemini 컨텍스트 폭주 방지. 가장 최근 N turn 만 보냄. */
    private static final int MAX_HISTORY_TURNS = 10;

    /**
     * 챗봇 후속 질문. 초기 체크 사용량은 이미 차감됐다고 보고 follow-up 은 추가 차감하지 않음 (plan B).
     * 다만 응급 키워드는 매 질문마다 재검사 — LLM 호출 없이 즉시 응급 응답으로 가로챈다.
     * 프론트에서 세션당 follow-up 횟수 cap (현재 5회) 을 enforce. 백엔드는 history 길이만 safety cap.
     */
    @Transactional(readOnly = true)
    public SymptomFollowupResponse followup(Long userId, SymptomFollowupRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        // 1단계: 응급 키워드 가로채기 — LLM 호출 전 안전망. history 가 아닌 새 질문 대상.
        String emergencyMatch = geminiService.matchEmergencyKeyword(request.question());
        if (emergencyMatch != null) {
            return new SymptomFollowupResponse(
                    "방금 보내주신 내용에 '" + emergencyMatch + "' 표현이 있어요. 지금 바로 가까운 24시 동물병원에 연락해주세요. " +
                            "이동하는 동안에도 호흡과 의식 상태를 계속 확인하세요.",
                    emergencyMatch,
                    geminiService.getDisclaimer());
        }

        // 2단계: 펫 컨텍스트 조회 (check() 와 동일 패턴)
        String species = null;
        Integer ageYears = null;
        if (request.petId() != null) {
            Pet pet = petRepository.findById(request.petId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
            boolean isOwner = pet.getUser().getId().equals(userId);
            boolean isShared = shareMemberRepository
                    .existsByPetIdAndMemberIdAndStatus(pet.getId(), userId, ShareStatus.ACCEPTED);
            if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
            species = humanSpecies(pet);
            ageYears = pet.getBirthDate() != null
                    ? (int) java.time.Period.between(pet.getBirthDate(), LocalDate.now()).toTotalMonths() / 12
                    : null;
        }

        String petContext = buildFollowupPetContext(
                species, ageYears, request.originalSymptoms(), request.originalDurationHours());

        // 3단계: history 안전 cap — 최근 MAX_HISTORY_TURNS turn 만 유지
        List<GeminiSymptomService.ChatTurn> trimmed = trimHistory(request.history());

        String answer = geminiService.followup(petContext, trimmed, request.question());

        // 4단계: 모델 답변에 응급 신호가 있어도 한 번 더 키워드 검사 — 안전망
        String answerEmergency = geminiService.matchEmergencyKeyword(answer);

        return new SymptomFollowupResponse(answer, answerEmergency, geminiService.getDisclaimer());
    }

    private String buildFollowupPetContext(String species, Integer ageYears,
                                            String originalSymptoms, Integer originalDurationHours) {
        StringBuilder sb = new StringBuilder();
        sb.append("초기 보호자 입력:\n");
        if (species != null) sb.append("- 종: ").append(species).append("\n");
        if (ageYears != null) sb.append("- 나이: ").append(ageYears).append("세\n");
        sb.append("- 증상: ").append(originalSymptoms).append("\n");
        if (originalDurationHours != null) {
            sb.append("- 지속 시간: ").append(originalDurationHours).append("시간\n");
        }
        sb.append("\n위 맥락을 이어받아 보호자의 후속 질문에 답해주세요.");
        return sb.toString();
    }

    private List<GeminiSymptomService.ChatTurn> trimHistory(List<SymptomFollowupRequest.Turn> history) {
        if (history == null || history.isEmpty()) return Collections.emptyList();
        int size = history.size();
        int from = Math.max(0, size - MAX_HISTORY_TURNS);
        List<GeminiSymptomService.ChatTurn> out = new ArrayList<>(size - from);
        for (int i = from; i < size; i++) {
            SymptomFollowupRequest.Turn t = history.get(i);
            GeminiSymptomService.ChatTurn.Role role = t.role() == SymptomFollowupRequest.Turn.Role.USER
                    ? GeminiSymptomService.ChatTurn.Role.USER
                    : GeminiSymptomService.ChatTurn.Role.ASSISTANT;
            out.add(new GeminiSymptomService.ChatTurn(role, t.content()));
        }
        return out;
    }

    private String humanSpecies(Pet pet) {
        return switch (pet.getSpecies()) {
            case DOG -> "강아지";
            case CAT -> "고양이";
            case BIRD -> "조류";
            case REPTILE -> "파충류";
            case SMALL_ANIMAL -> "소동물";
            case OTHER -> "특수동물";
        };
    }
}
