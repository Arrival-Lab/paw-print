# 03. 만료 알림 배치 시스템

## 작업 범위

매일 자정 (KST) 실행되는 스케줄러로 만료 임박 사용자에게 알림 발송.

## 알림 시점 4단계

| 시점 | 푸시 | 인앱 배너 | 인앱 모달 |
|------|------|----------|----------|
| D-14 | ❌ | ✅ (info) | ❌ |
| D-7 | ✅ 1회 | ✅ (warning) | ❌ |
| D-1 | ✅ 1회 | ✅ (critical) | ✅ |
| D+27 (할인 만료 3일 전) | ✅ 1회 | ✅ | ❌ |

## 배치 작업 조건

매일 자정 (KST) 실행. Spring Boot라면 `@Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")`.

각 시점별 조건:

```
D-14: premium_expires_at - 14 days <= now() < premium_expires_at - 13 days
      AND premium_expiry_notified_at.d14 IS NULL

D-7:  premium_expires_at - 7 days <= now() < premium_expires_at - 6 days
      AND premium_expiry_notified_at.d7 IS NULL

D-1:  premium_expires_at - 1 day <= now() < premium_expires_at
      AND premium_expiry_notified_at.d1 IS NULL

D+27: beta_discount_eligible_until - 3 days <= now() < beta_discount_eligible_until - 2 days
      AND premium_expiry_notified_at.discount_expiring IS NULL
```

각 발송 후 `premium_expiry_notified_at` 해당 키에 발송 시각 기록 (중복 발송 방지).

## 푸시 알림 문구

### D-7
```
제목: 발자국 프리미엄이 곧 종료돼요
내용: 7일 후 베타 프리미엄이 종료됩니다. 계속 이용하시려면 멤버십을 확인해주세요.
```

### D-1
```
제목: 내일 프리미엄이 종료돼요
내용: 베타 특별 할인이 준비되어 있어요. 앱에서 확인해주세요.
```

### D+27 (할인 만료 3일 전)
```
제목: 베타 테스터 특별 할인이 곧 종료돼요
내용: 3일 후 할인이 종료됩니다. 정상가 결제 전 확인해주세요.
```

## 푸시 채널

- FCM 사용 (이미 구축되어 있을 것)
- 사용자가 푸시 권한 거부했으면 푸시 발송 스킵 (인앱 배너로만 처리)
- 이미 정기 구독 시작한 사용자는 알림 발송 X

## 작업 완료 기준

- [ ] 스케줄러 작업 클래스 생성
- [ ] 각 시점별 쿼리 작성
- [ ] FCM 발송 로직 (기존 로직 활용)
- [ ] 알림 이력 기록 (중복 발송 방지)
- [ ] 단위 테스트 (mock 시간 사용)
