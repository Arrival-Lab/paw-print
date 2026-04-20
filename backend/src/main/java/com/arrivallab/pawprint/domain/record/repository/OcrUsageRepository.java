package com.arrivallab.pawprint.domain.record.repository;

import com.arrivallab.pawprint.domain.record.entity.OcrUsage;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OcrUsageRepository extends JpaRepository<OcrUsage, Long> {
    long countByUserAndYearMonth(User user, String yearMonth);
}
