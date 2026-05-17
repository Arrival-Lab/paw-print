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
        /** 현재 요청 user 가 owner 가 아니면 true (공유받은 펫). */
        Boolean isShared,
        /** isShared=true 일 때 원래 소유자 이름. owner 자신은 null. */
        String ownerName
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
                null,
                null
        );
    }

    public static PetResponse from(Pet pet, Long currentUserId) {
        boolean isShared = currentUserId != null && !pet.getUser().getId().equals(currentUserId);
        String ownerName = isShared ? pet.getUser().getName() : null;
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getBirthDate(),
                pet.getGender(),
                pet.getIsNeutered(),
                pet.getProfileImage(),
                isShared,
                ownerName
        );
    }
}
