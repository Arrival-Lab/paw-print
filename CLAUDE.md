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

## 브랜드 컬러 (실제 사용 hex)
- Primary `#F4A8B8` (로즈핑크) — 하이라이트(탭 active, chip selected, 캘린더 today). 흰 텍스트 2.1:1 ❌ → 어두운 ink 만.
- Primary Dark `#C47E8A` (부드러운 로즈) — CTA 배경. 흰 텍스트 3.7:1 (큰 글자/UI 통과, 본문 14sp 는 AA 미달). semibold 이상 흰 텍스트만 사용.
- Secondary `#F9D98C` (버터 옐로우) — 톤/일러스트·promotion banner. 흰 텍스트 1.4:1 ❌ → 어두운 ink 만.
- Secondary Dark `#D9B05B` (진한 노랑) — 흰 텍스트 2.7:1 ❌ → 어두운 ink 만.
- Premium `#9B6BCC` (라벤더) — 노랑/핑크와 시각 분리. PREMIUM 배지·구독 액션 한정.
- Success `#7EAD9B` (sage) — dearmi 차용. 어두운 채도 낮은 그린.

→ **흰 텍스트가 가능한 컬러는 `primaryDark` + `status.error` 뿐** (이마저도 큰 글자/굵은 글자 한정). 노랑·옅은 핑크 위 모든 텍스트는 어두운 ink. CTA·active 모두 핑크 톤으로 통일.

세부 토큰 (`glass.*`, `dark.*`, status bg) 은 `frontend/constants/colors.ts` 와 `frontend/CLAUDE.md` 참고.

## 기술 스택
- **Frontend**: React Native (Expo SDK 54) + TypeScript + NativeWind v4 + React Query v5 + Zustand v4 + MMKV + react-hook-form + zod + EAS Build + **Expo Push Service** (RNFirebase 폐기 — Expo SDK 54 use_frameworks 충돌 회피)
- **Backend**: Spring Boot 3.3 + Java 17 + PostgreSQL 18 (AWS RDS) + JPA(Hibernate 6.5) + Flyway + JWT + OAuth2 + FCM + AWS S3 + **Gemini Vision API** (OCR)
- **인프라**: AWS ECS Fargate + RDS db.t3.micro + S3 버킷(`pawprint-files`) + CloudWatch Logs + ECR
- **결제**: App Store IAP + Google Play Billing (`expo-iap`)

## ECS Fargate 운영 메모
- Spring Boot startup 시간이 길어서(현재 ~180s) ECS service의 `healthCheckGracePeriodSeconds` 를 **300초** 로 설정.
- `application-prod.yml` 에 `spring.main.lazy-initialization: true` 적용으로 eager bean 일부 이연.
- vCPU 부족이 startup 시간의 주요 원인이지만 비용 부담으로 증설 보류. JVM 옵션·lazy init·grace period 조합으로 대응.
- ECS service 는 main 브랜치 push 시 자동 배포. Flyway 가 startup 전 마이그레이션 실행.

## 빌드 / 배포
- **iOS dev build**: `npx eas build --profile development --platform ios` → TestFlight 없이 dev client 설치.
- **Xcode Cloud 사용 안 함** — EAS Build 만 사용. App Store Connect 의 Xcode Cloud 워크플로우는 비활성화 권장 (워크스페이스 경로 mismatch 로 매 push 마다 실패 메일 옴).
- 백엔드: git push origin main → ECS 자동 배포.

## 무료/프리미엄 제한 (백엔드 `@Premium` AOP + 프론트 402 → `PremiumModal`)
| 기능 | 무료 | 프리미엄 |
|---|---|---|
| 반려동물 프로필 | 3마리 | 무제한 |
| 사진 첨부 (건당) | 5장 | 무제한 |
| OCR 파싱 (월) | 5회 | 무제한 |
| 수치 트래킹 그래프 | 1개월치 | 무제한 |
| 예방접종 알림 | 3개 | 무제한 |
| 가족/친구 케어 공유 | 1명 | 무제한 |
| 진료기록·다이어리·커뮤니티·응급병원 | 무제한 | 무제한 |

## 핵심 도메인 모델 — 진료 사건 (dearmi 패턴 차용)
**진료일정 (Appointment) ↔ 진료기록 (MedicalRecord)** 양방향 링크:
- `medical_records.appointment_id` (V20 migration, FK ON DELETE SET NULL) — 기록은 살리고 링크만 끊김
- `AppointmentResponse.linkedRecordId` — 이 예약에서 작성된 기록 id
- 진료일정 상세 시트에 3단계 타임라인 (예약 등록 → 방문 → 기록 작성)
- "이 일정으로 진료기록 작성" CTA — RecordForm 에 `appointmentId` + prefill (visitedAt/병원/사유) 전달

병원명 autocomplete:
- `GET /api/pets/{petId}/records/hospital-suggestions` — 진료기록 + 진료일정 양쪽 distinct hospital name union
- 프론트 `<HospitalAutocomplete>` — RecordForm·AppointmentForm 양쪽에서 사용 (60s staleTime 캐시)

## 날씨 기반 케어 팁
홈 화면 상단 카드 — 위치 권한 받아서 기상청(KMA) 단기예보 + 대기질(KECO) 데이터 기반 트리거 평가:
- `GET /api/weather/care-tip?lat&lng` → trigger (RAIN / HOT / COLD / AIR_BAD / UV_HIGH / NONE) + 팁
- 트리거 NONE 또는 위치 거부 → 프론트가 월별 정적 팁(`MonthlyCareGuideModal`) 으로 폴백
- 백엔드 `domain/weather/` — KMA·KECO 클라이언트 + Lambert 격자 변환 + Mock provider (local profile)
