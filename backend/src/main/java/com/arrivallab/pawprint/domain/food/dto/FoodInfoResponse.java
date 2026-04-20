package com.arrivallab.pawprint.domain.food.dto;

import com.arrivallab.pawprint.domain.food.entity.FoodInfo;

import java.time.LocalDateTime;

public record FoodInfoResponse(
        Long id,
        String currentFood,
        String[] allergies,
        String[] forbiddenFoods,
        String notes,
        LocalDateTime updatedAt
) {
    public static FoodInfoResponse from(FoodInfo f) {
        return new FoodInfoResponse(f.getId(), f.getCurrentFood(), f.getAllergies(),
                f.getForbiddenFoods(), f.getNotes(), f.getUpdatedAt());
    }
}
