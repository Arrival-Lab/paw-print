package com.arrivallab.pawprint.domain.food.dto;

public record FoodInfoRequest(
        String currentFood,
        String[] allergies,
        String[] forbiddenFoods,
        String notes
) {}
