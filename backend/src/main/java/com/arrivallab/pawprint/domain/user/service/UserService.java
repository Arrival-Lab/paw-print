package com.arrivallab.pawprint.domain.user.service;

import com.arrivallab.pawprint.domain.auth.dto.UserResponse;
import com.arrivallab.pawprint.domain.user.dto.NotificationPreferencesDto;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.regex.Pattern;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[가-힣a-zA-Z0-9_]{2,20}$");

    private final UserRepository userRepository;

    public UserResponse updateLocale(Long userId, String locale) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateLocale(locale);
        return UserResponse.from(user);
    }

    public UserResponse updateNickname(Long userId, String nickname) {
        if (nickname == null || !NICKNAME_PATTERN.matcher(nickname.trim()).matches()) {
            throw new BusinessException(ErrorCode.INVALID_NICKNAME);
        }
        String normalized = nickname.trim();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (normalized.equals(user.getNickname())) {
            return UserResponse.from(user);
        }
        if (userRepository.existsByNickname(normalized)) {
            throw new BusinessException(ErrorCode.NICKNAME_DUPLICATED);
        }
        user.updateNickname(normalized);
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(Long userId, String nickname) {
        if (nickname == null || !NICKNAME_PATTERN.matcher(nickname.trim()).matches()) {
            return false;
        }
        String normalized = nickname.trim();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (normalized.equals(user.getNickname())) return true;
        return !userRepository.existsByNickname(normalized);
    }

    @Transactional(readOnly = true)
    public NotificationPreferencesDto getNotificationPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return NotificationPreferencesDto.from(user);
    }

    public NotificationPreferencesDto updateNotificationPreferences(Long userId, NotificationPreferencesDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        user.updateNotificationPreferences(request.notifyVaccine(), request.notifyCare());
        return NotificationPreferencesDto.from(user);
    }

    public void deleteMyAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        // FK ON DELETE CASCADE 가 pets/refresh_tokens/medical_records/diaries/
        // appointments/vaccines/care_items/health_metrics/food_info/share_members/
        // posts/comments/post_likes/post_reports/subscriptions/user_blocks/
        // symptom_check_usages 를 모두 함께 삭제. (V25 migration 으로 share/report
        // 의 owner/member/reporter FK 에도 CASCADE 추가됨)
        log.info("Deleting user account: userId={} email={}", user.getId(), user.getEmail());
        userRepository.delete(user);
    }
}
