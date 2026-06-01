package com.arrivallab.pawprint.domain.user.service;

import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.List;

/**
 * 회원가입 시 사용자가 직접 설정하기 전에 자동으로 부여하는 닉네임 생성기.
 *
 * 전략(하이브리드):
 *  1차 — 형용사 + 명사 그대로 (예: '포근한토끼'). 자연스러운 톤.
 *  2차+ — 충돌 시 4자리 숫자 suffix (예: '포근한토끼4821'). 사실상 충돌 0.
 *  fallback — 'user' + 8자리 숫자. 사전 + retry 모두 실패한 경우의 안전망.
 *
 * 사전 크기: 형용사 48 × 명사 30 = 1440 조합. 사용자 수가 적은 초기엔 거의 1차에서 성공.
 * 닉네임 정규식 ^[가-힣a-zA-Z0-9_]{2,20}$ 충족 (최대 14자: 한글 8 + 숫자 4 + 여유).
 */
@Component
@RequiredArgsConstructor
public class AutoNicknameGenerator {

    private static final List<String> ADJECTIVES = List.of(
            "포근한", "용감한", "수줍은", "씩씩한", "다정한", "따뜻한", "사랑스러운",
            "호기심많은", "활발한", "차분한", "행복한", "즐거운", "신나는", "똑똑한",
            "귀여운", "사뿐한", "폭신한", "보송한", "솜털같은", "반짝이는",
            "빛나는", "화창한", "푸근한", "든든한", "슬기로운", "친절한", "명랑한",
            "활기찬", "평화로운", "천진한", "순수한", "깜찍한", "산뜻한",
            "부드러운", "달콤한", "향긋한", "우아한", "단정한", "정갈한", "단아한",
            "잔잔한", "자유로운", "시원한", "야무진", "조용한", "다부진", "당당한", "고요한"
    );

    private static final List<String> NOUNS = List.of(
            "강아지", "고양이", "토끼", "다람쥐", "햄스터", "너구리", "사슴", "곰돌이",
            "여우", "부엉이", "펭귄", "도토리", "별빛", "구름", "햇살", "단풍",
            "무지개", "보름달", "새싹", "들꽃", "호두", "밤톨", "솔잎", "풀잎",
            "이슬", "산들바람", "노을", "자갈", "조개", "조약돌"
    );

    private static final int MAX_ATTEMPTS = 10;

    private final SecureRandom random = new SecureRandom();
    private final UserRepository userRepository;

    public String generateUnique() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            String base = pick(ADJECTIVES) + pick(NOUNS);
            String candidate = i == 0 ? base : base + randomDigits(4);
            if (!userRepository.existsByNickname(candidate)) {
                return candidate;
            }
        }
        // 사실상 도달 불가 — 사전 1440조합 + 9999 suffix 가 모두 막혀야 함.
        return "user" + randomDigits(8);
    }

    private String pick(List<String> list) {
        return list.get(random.nextInt(list.size()));
    }

    private String randomDigits(int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) sb.append(random.nextInt(10));
        return sb.toString();
    }
}
