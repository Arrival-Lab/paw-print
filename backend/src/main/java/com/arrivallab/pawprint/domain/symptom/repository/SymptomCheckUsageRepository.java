package com.arrivallab.pawprint.domain.symptom.repository;

import com.arrivallab.pawprint.domain.symptom.entity.SymptomCheckUsage;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SymptomCheckUsageRepository extends JpaRepository<SymptomCheckUsage, Long> {
    long countByUserAndYearMonth(User user, String yearMonth);
}
