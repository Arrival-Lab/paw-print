package com.arrivallab.pawprint.global.aop;

import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
public class PremiumAspect {

    private final UserRepository userRepository;

    @Around("@annotation(com.arrivallab.pawprint.global.annotation.Premium)")
    public Object checkPremium(ProceedingJoinPoint joinPoint) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        Long userId = Long.parseLong(authentication.getName());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        boolean active = user.getSubscriptionType() == SubscriptionType.PREMIUM
                && (user.getSubscriptionExpiresAt() == null
                    || user.getSubscriptionExpiresAt().isAfter(LocalDateTime.now()));

        if (!active) throw new BusinessException(ErrorCode.PREMIUM_REQUIRED);

        return joinPoint.proceed();
    }
}
