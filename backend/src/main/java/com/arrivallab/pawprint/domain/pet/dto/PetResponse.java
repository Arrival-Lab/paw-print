package com.arrivallab.pawprint.domain.pet.dto;

import com.arrivallab.pawprint.domain.pet.entity.Gender;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.entity.Species;

import java.time.LocalDate;

public record PetResponse(
        Long id,
        String name,
        Species species,
        String breed,
        LocalDate birthDate,
        Gender gender,
        Boolean isNeutered,
        String profileImage,
        /** 펫 식별 색상 (#RRGGBB). 미지정 시 null — 프론트가 기본 팔레트 폴백. */
        String color,
        /** 현재 요청 user 가 owner 가 아니면 true (공유받은 펫). */
        Boolean isShared,
        /** isShared=true 일 때 원래 소유자 이름. owner 자신은 null. */
        String ownerName,
        /** ACCEPTED 상태 공유 멤버 수 (소유자 제외). 미지정 시 null. */
        Long sharedMemberCount
) {
    /** currentUserId 없이 호출 시 isShared/ownerName 은 null. legacy 호환용. */
    public static PetResponse from(Pet pet) {
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getBirthDate(),
                pet.getGender(),
                pet.getIsNeutered(),
                pet.getProfileImage(),
                pet.getColor(),
                null,
                null,
                null
        );
    }

    public static PetResponse from(Pet pet, Long currentUserId) {
        return from(pet, currentUserId, null);
    }

    public static PetResponse from(Pet pet, Long currentUserId, Long sharedMemberCount) {
        boolean isShared = currentUserId != null && !pet.getUser().getId().equals(currentUserId);
        // 닉네임이 설정되어 있으면 닉네임 우선 — Apple 로그인 시 user.name 이 "Apple User" 같은 default 라
        // 그대로 노출하면 공유받은 사람 화면에 "Apple User님이 공유한 펫" 으로 보임.
        String ownerName = null;
        if (isShared) {
            String nickname = pet.getUser().getNickname();
            ownerName = (nickname != null && !nickname.isBlank()) ? nickname : pet.getUser().getName();
        }
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getBirthDate(),
                pet.getGender(),
                pet.getIsNeutered(),
                pet.getProfileImage(),
                pet.getColor(),
                isShared,
                ownerName,
                sharedMemberCount
        );
    }
}
