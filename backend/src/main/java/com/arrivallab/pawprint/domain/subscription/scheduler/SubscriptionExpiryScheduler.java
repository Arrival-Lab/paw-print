package com.arrivallab.pawprint.domain.subscription.scheduler;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
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
