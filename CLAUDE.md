# 발자국 (Paw Print)

## 프로젝트
팀: Arrival Lab — 채연 1인 풀스택 (기획·디자인·프론트·백엔드·인프라 전부).
반려동물 보호자용 진료기록·건강 추적·커뮤니티 모바일 앱.
App Store + Google Play 동시 출시 목표.

## 절대 규칙 (위반 금지)
1. 컬러·폰트·간격·가격 등 모든 상수 → `frontend/constants/` 에서만 import. 컴포넌트 안에 하드코딩 절대 금지.
2. NativeWind className 안에도 hex 코드 직접 입력 금지. `tailwind.config.js` 에 Colors 연동해서 사용.
3. 비즈니스 로직은 UI 컴포넌트에 넣지 않는다. Service/Hook/Store에 분리.
4. API URL·서버 주소·외부 키는 환경변수에서만. 소스코드에 하드코딩 절대 금지.
5. 카카오 API 키는 백엔드 환경변수에만. 프론트 `EXPO_PUBLIC_` 에 절대 노출 금지.
6. 모든 API 호출은 `frontend/shared/api/client.ts` 인스턴스만 사용.
7. StyleSheet 사용 금지. 모든 스타일은 NativeWind className 또는 인라인 style에 토큰 spread.

## 브랜드 컬러
- Primary: `#5B7FA6` (슬레이트블루) — 메인 CTA, 탭 활성, 헤더, 링크
- Secondary: `#7EC8E3` (스카이블루) — FAB, 보조 액션, 차트 액센트

세부 토큰·라이트/다크·접근성·상태 배경 등은 `frontend/constants/colors.ts` 와 `frontend/CLAUDE.md` 참고.

## 기술 스택
- **Frontend**: React Native (Expo SDK 51+) + TypeScript + NativeWind v4 + React Query v5 + Zustand v4 + MMKV + react-hook-form + zod + EAS Build
- **Backend**: Spring Boot 3.3 + Java 17 + PostgreSQL 18 (AWS RDS) + JPA(Hibernate 6.5) + Flyway + JWT + OAuth2 + FCM + AWS S3 + **Gemini Vision API** (OCR)
- **인프라**: AWS ECS Fargate + RDS db.t3.micro + S3 버킷(`pawprint-files`) + CloudWatch Logs + ECR
- **결제**: App Store IAP + Google Play Billing (`expo-iap`)

## ECS Fargate 운영 메모
- Spring Boot startup 시간이 길어서(현재 ~180s) ECS service의 `healthCheckGracePeriodSeconds` 를 **300초** 로 설정.
- `application-prod.yml` 에 `spring.main.lazy-initialization: true` 적용으로 eager bean 일부 이연.
- vCPU 부족이 startup 시간의 주요 원인이지만 비용 부담으로 증설 보류. JVM 옵션·lazy init·grace period 조합으로 대응.

## 무료/프리미엄 제한 (백엔드 `@Premium` AOP + 프론트 402 → `PremiumModal`)
| 기능 | 무료 | 프리미엄 |
|---|---|---|
| 반려동물 프로필 | 3마리 | 무제한 |
| 사진 첨부 (건당) | 2장 | 무제한 |
| OCR 파싱 (월) | 3회 | 무제한 |
| 수치 트래킹 그래프 | 1개월치 | 무제한 |
| 예방접종 알림 | 2개 | 무제한 |
| 가족/친구 케어 공유 | 1명 | 무제한 |
| 진료기록·다이어리·커뮤니티·응급병원 | 무제한 | 무제한 |
