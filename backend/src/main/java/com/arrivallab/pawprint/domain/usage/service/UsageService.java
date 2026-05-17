package com.arrivallab.pawprint.domain.usage.service;

import com.arrivallab.pawprint.domain.record.repository.OcrUsageRepository;
import com.arrivallab.pawprint.domain.usage.dto.UsageResponse;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsageService {

    private final OcrUsageRepository ocrUsageRepository;
    private final UserRepository userRepository;

    public UsageResponse getCurrentUsage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        String yearMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        long ocrCount = ocrUsageRepository.countByUserAndYearMonth(user, yearMonth);
        return new UsageResponse(ocrCount, yearMonth);
    }
}
