package com.arrivallab.pawprint.domain.care.repository;

import com.arrivallab.pawprint.domain.care.entity.CareItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CareItemRepository extends JpaRepository<CareItem, Long> {
    List<CareItem> findByPet_IdAndActiveTrueOrderBySortOrderAscIdAsc(Long petId);
    long countByPet_IdAndActiveTrue(Long petId);
}
