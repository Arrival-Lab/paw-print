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

import java.time.Clock;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UsageService {

    private static final DateTimeFormatter YEAR_MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");
    /** 표시되는 사용량 달도 한도 집행(OcrUsageService)과 동일하게 KST 기준으로 집계. */
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final OcrUsageRepository ocrUsageRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public UsageResponse getCurrentUsage(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        String yearMonth = YearMonth.now(clock.withZone(KST)).format(YEAR_MONTH_FMT);
        long ocrCount = ocrUsageRepository.countByUserAndYearMonth(user, yearMonth);
        return new UsageResponse(ocrCount, yearMonth);
    }
}
