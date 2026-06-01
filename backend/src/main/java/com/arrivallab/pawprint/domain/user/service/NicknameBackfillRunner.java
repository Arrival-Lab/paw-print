package com.arrivallab.pawprint.domain.user.service;

import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 신규 가입자는 AuthService 에서 자동 닉네임을 받지만, 그 전에 가입한 사용자는 nickname=null 상태로 남아 있을 수 있음.
 * (이전엔 _layout.tsx 가드가 강제 onboarding 으로 채워줬는데, 그 가드를 제거하면서 null 상태가 노출되는 케이스 방지.)
 *
 * 시작 시 nickname IS NULL 유저만 조회해 자동 닉네임 부여. 이미 채워진 유저는 query 에서 빠져 비-op.
 * local profile 에서만 실행 — prod 는 한 번만 돌리고 의도치 않은 재실행이 없도록 별도 admin 엔드포인트로 관리하는 게
 * 안전하지만, 현재 운영 규모(소수)에선 매 startup 비-op 으로 충분.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Order(50)
public class NicknameBackfillRunner implements ApplicationRunner {

    private final UserRepository userRepository;
    private final AutoNicknameGenerator autoNicknameGenerator;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<User> targets = userRepository.findByNicknameIsNull();
        if (targets.isEmpty()) return;
        log.info("Nickname backfill: {} user(s) without nickname — assigning auto nicknames", targets.size());
        for (User u : targets) {
            String nickname = autoNicknameGenerator.generateUnique();
            u.updateNickname(nickname);
            log.info("Nickname backfill: userId={} email={} nickname={}", u.getId(), u.getEmail(), nickname);
        }
    }
}
