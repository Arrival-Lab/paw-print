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
        String profileImage
) {
    public static PetResponse from(Pet pet) {
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getBirthDate(),
                pet.getGender(),
                pet.getIsNeutered(),
                pet.getProfileImage()
        );
    }
}
