package com.arrivallab.pawprint.domain.pet.dto;

import com.arrivallab.pawprint.domain.pet.entity.Gender;
import com.arrivallab.pawprint.domain.pet.entity.Species;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record PetRequest(
        @NotBlank String name,
        @NotNull Species species,
        String breed,
        LocalDate birthDate,
        @NotNull Gender gender,
        boolean isNeutered,
        // 펫 식별 색상. null 허용(미지정). 지정 시 #RRGGBB 형식만.
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "color 는 #RRGGBB 형식이어야 합니다.")
        String color
) {}
