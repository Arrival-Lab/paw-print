package com.arrivallab.pawprint.domain.food.service;

import com.arrivallab.pawprint.domain.food.dto.FoodInfoRequest;
import com.arrivallab.pawprint.domain.food.dto.FoodInfoResponse;
import com.arrivallab.pawprint.domain.food.entity.FoodInfo;
import com.arrivallab.pawprint.domain.food.repository.FoodInfoRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class FoodInfoService {

    private final FoodInfoRepository foodInfoRepository;
    private final PetRepository petRepository;
    private final ShareMemberRepository shareMemberRepository;

    @Transactional(readOnly = true)
    public FoodInfoResponse get(Long userId, Long petId) {
        getPetWithAccess(userId, petId);
        return foodInfoRepository.findByPetId(petId)
                .map(FoodInfoResponse::from)
                .orElse(null);
    }

    public FoodInfoResponse upsert(Long userId, Long petId, FoodInfoRequest request) {
        Pet pet = getPetWithAccess(userId, petId);
        FoodInfo foodInfo = foodInfoRepository.findByPetId(petId)
                .orElse(null);
        if (foodInfo == null) {
            foodInfo = FoodInfo.builder()
                    .pet(pet)
                    .currentFood(request.currentFood())
                    .allergies(request.allergies() != null ? request.allergies() : new String[0])
                    .forbiddenFoods(request.forbiddenFoods() != null ? request.forbiddenFoods() : new String[0])
                    .notes(request.notes())
                    .build();
            foodInfoRepository.save(foodInfo);
        } else {
            foodInfo.update(request.currentFood(),
                    request.allergies() != null ? request.allergies() : new String[0],
                    request.forbiddenFoods() != null ? request.forbiddenFoods() : new String[0],
                    request.notes());
        }
        return FoodInfoResponse.from(foodInfo);
    }

    /** 소유자 + ACCEPTED 멤버 모두 통과 — 양방향 공유 모델. */
    private Pet getPetWithAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        boolean isOwner = pet.getUser().getId().equals(userId);
        boolean isShared = shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }
}
