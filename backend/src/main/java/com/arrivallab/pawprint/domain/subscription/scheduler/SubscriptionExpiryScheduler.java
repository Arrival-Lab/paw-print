package com.arrivallab.pawprint.domain.subscription.scheduler;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.RefreshTokenRepository;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionExpiryScheduler {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    // 사용된(rotated) refresh token 10분 후 정리
    @Scheduled(fixedDelay = 600_000)
    @Transactional
    public void cleanRotatedTokens() {
        refreshTokenRepository.deleteByRotatedAtBefore(LocalDateTime.now().minusMinutes(10));
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void expireSubscriptions() {
        List<User> expired = userRepository.findExpiredBySubscriptionType(
                SubscriptionType.PREMIUM, LocalDateTime.now());
        for (User user : expired) {
            user.updateSubscription(SubscriptionType.FREE, null);
            log.info("Subscription expired: userId={}", user.getId());
        }
        if (!expired.isEmpty()) {
            log.info("Expired {} premium subscriptions", expired.size());
        }
    }
}
