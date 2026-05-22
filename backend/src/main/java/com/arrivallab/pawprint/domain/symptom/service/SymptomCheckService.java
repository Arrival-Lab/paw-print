package com.arrivallab.pawprint.domain.symptom.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckRequest;
import com.arrivallab.pawprint.domain.symptom.dto.SymptomCheckResponse;
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
