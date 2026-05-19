package com.arrivallab.pawprint.domain.user.service;

import com.arrivallab.pawprint.domain.auth.dto.UserResponse;
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
}
