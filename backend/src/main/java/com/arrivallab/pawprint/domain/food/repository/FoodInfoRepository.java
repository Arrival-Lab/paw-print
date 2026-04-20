package com.arrivallab.pawprint.domain.food.repository;

import com.arrivallab.pawprint.domain.food.entity.FoodInfo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FoodInfoRepository extends JpaRepository<FoodInfo, Long> {

    Optional<FoodInfo> findByPetId(Long petId);
}
