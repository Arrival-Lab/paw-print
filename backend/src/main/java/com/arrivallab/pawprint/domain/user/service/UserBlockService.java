package com.arrivallab.pawprint.domain.user.service;

import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.entity.UserBlock;
import com.arrivallab.pawprint.domain.user.repository.UserBlockRepository;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;

    public void block(Long blockerId, Long blockedId) {
        if (blockerId.equals(blockedId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        if (userBlockRepository.existsByBlocker_IdAndBlocked_Id(blockerId, blockedId)) {
            return; // idempotent
        }
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        userBlockRepository.save(UserBlock.builder().blocker(blocker).blocked(blocked).build());
    }

    public void unblock(Long blockerId, Long blockedId) {
        userBlockRepository.findByBlocker_IdAndBlocked_Id(blockerId, blockedId)
                .ifPresent(userBlockRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<Long> getBlockedIds(Long blockerId) {
        return userBlockRepository.findBlockedIdsByBlockerId(blockerId);
    }

    @Transactional(readOnly = true)
    public List<BlockedUserDto> listBlocked(Long blockerId) {
        return userBlockRepository.findAllByBlocker_IdOrderByCreatedAtDesc(blockerId).stream()
                .map(ub -> new BlockedUserDto(
                        ub.getBlocked().getId(),
                        ub.getBlocked().getNickname(),
                        ub.getBlocked().getProfileImage(),
                        ub.getCreatedAt()))
                .toList();
    }

    public record BlockedUserDto(Long userId, String nickname, String profileImage,
                                 java.time.LocalDateTime blockedAt) {}
}
