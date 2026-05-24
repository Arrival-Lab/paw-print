package com.arrivallab.pawprint.domain.pet.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 펫 소유자 + ACCEPTED 공유 멤버에게만 접근 허용하는 가드.
 * 진료기록/다이어리/케어 등 펫-스코프 서비스들이 공통 사용.
 */
@Component
@RequiredArgsConstructor
public class PetAccessGuard {

    private final PetRepository petRepository;
    private final ShareMemberRepository shareMemberRepository;

    /** 펫 객체가 필요한 작업 — 생성/수정/조회. 권한 통과 시 Pet 반환. */
    @Transactional(readOnly = true)
    public Pet requireAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        if (!hasAccess(userId, pet)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    /** 권한 체크만 필요한 작업 — 리스트 조회 등. 펫 객체 불러올 필요 없음. */
    @Transactional(readOnly = true)
    public void checkAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        if (!hasAccess(userId, pet)) throw new BusinessException(ErrorCode.FORBIDDEN);
    }

    private boolean hasAccess(Long userId, Pet pet) {
        if (pet.getUser().getId().equals(userId)) return true;
        return shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(pet.getId(), userId, ShareStatus.ACCEPTED);
    }
}
