# 보안 + 클린 아키텍처 정리 (2026-05-24)

브랜치: `security-and-clean-arch-phase1` (main 미머지)
대상: Spring Boot 백엔드 + React Native 프론트엔드 전체

## 요약

전 코드베이스에 대해 보안 취약점 우선순위 감사 + SOLID 5원칙 + Dependency Rule 준수 감사를 수행. 발견된 12개 카테고리 중 **Phase 1·2 (8개) 작업 완료** — 6개 커밋. Phase 3 (5건의 대형 리팩토링) 은 별도 PR 로 분리.

기존 사용자 경험에 영향 가는 항목 (refresh token rotation, 토큰 SecureStore 이전) 은 **무중단 마이그레이션 코드 포함**.

---

## Phase 1-A — 안전한 즉시 수정 ([5390c99](../))

| 항목 | 변경 파일 | 핵심 |
|---|---|---|
| placeUrl 스킴 화이트리스트 | `frontend/features/hospital/components/HospitalCard.tsx` | 카카오 응답이 변조되어도 `javascript:`/`data:`/`intent:` 등 비-HTTP 스킴이 `WebBrowser.openBrowserAsync()` 로 전달되지 않도록 `map.kakao.com` / `place.map.kakao.com` 화이트리스트 |
| 하드코딩 색상 토큰화 | `frontend/app/(auth)/login.tsx`, `frontend/constants/colors.ts` | `#000000`(Apple) / `#4285F4`(Google) / `#FFFFFF` 인라인 → `Colors.social.appleBlack` / `Colors.social.googleBlue` / `Colors.white`. CLAUDE.md 절대 규칙 #1 준수 |
| MockWeatherProvider LSP | `backend/.../weather/service/MockWeatherProvider.java` | lat 인자를 무시해 `WeatherProvider` 계약 위반이던 것을 위도 기반 기온 변화 반영해서 substitutability 회복 |

---

## Phase 1-B — IDOR/권한 검증 보강 ([b0b8394](../))

| 항목 | 변경 파일 | 핵심 |
|---|---|---|
| Share invite 자기수락 차단 | `backend/.../share/service/ShareService.java` | 본인 펫의 초대를 본인이 수락하는 케이스 (코드 잘못 입력 등) `INVALID_INPUT` 으로 차단 |
| MedicalRecord ↔ Appointment cross-pet 검증 | `backend/.../record/service/MedicalRecordService.java`, `.../appointment/repository/AppointmentRepository.java` | 진료기록 생성 시 클라이언트가 보낸 `appointmentId` 가 같은 펫 소속인지 검증 — 타 사용자 예약 ID 가로채는 IDOR 차단 |

---

## Phase 1-C — Domain/Infra 의존성 역전 ([1f9418e](../))

클린 아키텍처 Dependency Rule (내층 → 외층 금지) 위반 정리.

| 항목 | 변경 파일 | 핵심 |
|---|---|---|
| `PushNotificationPort` 도입 | `backend/.../global/notification/PushNotificationPort.java` (신규) | 도메인 스케줄러가 `infra/fcm/FcmService` 를 직접 참조하던 것을 추상화. `FcmService` 가 포트 구현 |
| 스케줄러 포트 사용 | `CareReminderScheduler`, `VaccineAlertScheduler` | `FcmService` → `PushNotificationPort` 의존. 도메인은 더 이상 infra 패키지 import 없음 |
| RestTemplate DIP | `GoogleAuthService`, `AppleAuthService`, `GeminiOcrService` | `new RestTemplate()` 직접 생성 → 이미 등록된 `WebConfig.@Bean restTemplate()` 주입 |

---

## Phase 1-D — 입력 검증 + 의도 명시 ([d7e7673](../))

| 항목 | 변경 파일 | 핵심 |
|---|---|---|
| DTO `@Size` 길이 제한 | `DiaryRequest`, `PostRequest`, `CommentRequest`, `MedicalRecordRequest`, `NicknameRequest` | 1GB body 등으로 인한 DB bloat / payload DoS 방어. 본문 ≤ 5000자, 댓글 ≤ 1000자, 닉네임 ≤ 30자 등 |
| Session policy 의도 명시 | `SecurityConfig.java` | 감사는 STATELESS 권장이었으나 Spring Security OAuth2 핸드셰이크가 state(PKCE/nonce) 저장에 세션 필요. 변경 시 Google/Apple 로그인 깨짐 → IF_REQUIRED 유지 + 주석 추가 |

---

## Phase 2-A — 사용자 영향 가능 보안 강화 ([6a488c5](../))

| 항목 | 변경 파일 | 핵심 |
|---|---|---|
| CORS 헤더 화이트리스트 | `SecurityConfig.java` | `allowedHeaders("*")` + `allowCredentials(true)` 위험 조합 → `Authorization, Content-Type, Accept, Accept-Language, X-Requested-With` 명시. `exposedHeaders: [Authorization]`, `maxAge: 3600` 추가 |
| X-Forwarded-For spoof 차단 | `RateLimitInterceptor.java` | leftmost (사용자가 임의 주입 가능) → rightmost (ALB 가 끝에 추가하는 실제 클라이언트 IP) 사용. 매 요청 다른 가짜 IP 로 인증 brute force 우회하던 경로 차단 |
| OCR/AI per-user rate limit | `UserRateLimitInterceptor.java` (신규), `WebConfig.java` | `/api/records/ocr`, `/api/records/audio`, `/api/ai/symptom-check**` 에 userId 기반 30req/min. `@Premium` AOP 의 월간 한도와 별개의 burst guard — 스크립트로 Gemini 비용 폭발 차단 |

### 주의 — 변경된 호출 동작
- 어떤 클라이언트가 화이트리스트에 없는 헤더 (`X-Custom-*` 등) 를 보내면 CORS preflight 실패. 현재 axios client 가 보내는 헤더만 화이트리스트 → 모바일 앱은 영향 없음. **새 헤더 추가 시 SecurityConfig 도 같이 갱신 필요**.
- per-user rate limit 30 req/min 은 정상 사용자 한참 위 (수동 OCR 은 분당 1-2회). 자동화 스크립트만 차단됨.

---

## Phase 2-B — 토큰 보안 강화 + 마이그레이션 ([65d2fc4](../))

### JWT refresh rotation + reuse detection 활성화

**문제**: `RefreshToken` 엔티티에 `rotatedAt` 필드, `markAsRotated()` 메서드, `cleanRotatedTokens` 스케줄러 (10분 grace) 까지 인프라가 다 갖춰져 있는데, `AuthService.refresh()` 가 `issueTokens()` 로 회전 직후 `deleteByUser` 호출해서 회전 토큰을 즉시 지움 → `if (refreshToken.isRotated())` reuse detection 분기가 **dead code**.

**수정**: `issueRotatedTokens()` 분리. 회전 경로에선 `deleteByUser` 안 함. 직전 토큰은 10분 grace 동안 남아 있다가 스케줄러가 청소. 그 사이 재제출되면 reuse detected 로그 + 전 세션 무효화 동작.

**영향**: 기존 유저 무영향. fresh 로그인 (Google/Apple) 은 그대로 single-session 유지, refresh 만 동작 보강.

### 토큰 저장소 MMKV → expo-secure-store

**문제**: access/refresh 토큰이 MMKV 에 평문 저장. 루팅/탈옥 단말에서 30일짜리 refresh 토큰 평문 추출 가능.

**해결**: `expo-secure-store` (iOS Keychain / Android Keystore) 이전. 동기 인터페이스 (`getAccessToken()`) 유지 위해 메모리 캐시 패턴 채택:

1. `initAuthStorage()` 부팅 1회 호출
   - MMKV 에 기존 토큰 있으면 SecureStore 로 복사 후 MMKV 에서 제거 (**무중단 마이그레이션**)
   - SecureStore → 메모리 캐시 워밍
2. `getAccessToken()` / `getRefreshToken()` 는 캐시 동기 읽기
3. 세터는 캐시 즉시 갱신 + SecureStore async fire-and-forget
4. `_layout.tsx` 가 `storageReady` 까지 SplashScreen 유지 → 토큰 없이 API 호출되는 race 차단
5. `hydrateAuthFromStorage()` 가 캐시 워밍 후 `authStore.isAuthenticated` 갱신

**영향**: 기존 사용자가 앱 업데이트 후 첫 부팅 시 마이그레이션 자동 실행 → 자연스럽게 SecureStore 로 이전. 로그아웃되지 않음.

---

## Phase 3 — 별도 PR 권장 (대형 리팩토링)

같은 브랜치에 묶으면 diff 가 너무 커져서 리뷰 어려움. **각각 별도 PR 로 분리**.

| 항목 | 영역 | 예상 규모 |
|---|---|---|
| `SubscriptionVerifier` 전략 패턴 (OCP) | 백엔드 — `SubscriptionService` 의 iOS/Android `if-else` 분기를 `IosVerifier` / `AndroidVerifier` 구현체로 분리 | 신규 클래스 3, 기존 1 수정 |
| `TriggerEvaluator` 전략 패턴 (OCP) | 백엔드 — `WeatherTrigger` 11-way if chain 을 `TriggerSpec` 리스트로 전환 | 1 파일 리팩토링 |
| Service SRP 분리 | 백엔드 — `MedicalRecordService` (234줄, 12 method), `SubscriptionService` (262줄), `DiaryService` (241줄) 를 책임별 분리 (Attachment / Ocr / Verification 등) | 다수 신규 + ApplicationService 패턴 도입 검토 |
| `shared/ → features/` 역방향 import 6건 정리 | 프론트 — `ScreenHeader`, `Fab`, `HospitalAutocomplete`, `PremiumModal`, `useNotificationResponse`, `push.ts` | 일부는 feature 로 이동, 일부는 prop injection 으로 의존성 제거 |
| 500줄+ Screen 분해 (SRP) | 프론트 — `app/(tabs)/diary.tsx` (1087줄), `features/care/components/CareTab.tsx` (1047줄), `app/pets/[id].tsx` (765줄), `app/symptom-check.tsx` (600줄) | 화면별 sub-component / hook 추출 |

---

## False Positive 정리

감사에서 잡혔으나 실제론 문제 없던 항목 (검증 후 제외).

| 항목 | 실제 |
|---|---|
| "Gemini/KMA API key 로그 노출" | `KmaWeatherProvider.java:43` 의 `kmaKey={}` 포맷 변수는 boolean `hasKmaKey` 값이 들어감. FCM 토큰도 `tokenPreview` 로 잘림. **실제 평문 노출 없음** |
| "Firebase API key 유출" (`google-services.json`) | Firebase 설계상 공개 정상. Cloud Console 의 Security Rules + API key restriction 으로 보호하면 됨 |
| "EXPO_PUBLIC_GOOGLE_CLIENT_ID 노출" | Google OAuth client ID 는 본래 공개됨. 비밀 아님 |
| "Apple Team ID 하드코딩" | 앱 서명에 포함되는 공개 식별자. 비밀 아님 |
| "IAP receipt 백엔드 검증 누락" | `SubscriptionService.java:161, 197` 에 Apple `verifyReceipt` + Google `AndroidPublisher` 호출 확인됨 |
| "Refresh token rotation 없음" | 인프라는 다 있고 단지 dead code 였음. Phase 2-B 에서 활성화 |

---

## SOLID + Dependency Rule 진척

| 원칙 | 감사 시점 | 현재 | 남은 작업 |
|---|---|---|---|
| SRP | ❌ FAIL | 🟡 부분 | Service/Screen 분리 (Phase 3) |
| OCP | ❌ FAIL | 🟡 부분 | Verifier/Trigger 전략화 (Phase 3) |
| LSP | 🟡 부분 | ✅ PASS | MockWeather 수정 완료 |
| ISP | ✅ PASS | ✅ PASS | — |
| DIP | ❌ FAIL | 🟡 부분 | shared→features 역방향 6건 (Phase 3) |
| Dependency Rule | ❌ FAIL | 🟡 부분 | shared→features 역방향 6건 (Phase 3) |

---

## 배포 체크리스트

1. 이 브랜치를 **staging 환경에서 먼저 검증** (특히 CORS, SecureStore 마이그레이션, refresh rotation 동작).
2. CORS 헤더 화이트리스트가 marketing-site 등 다른 클라이언트 호출과 충돌 없는지 확인.
3. 기존 단말 1대로 앱 업데이트 → 자동 로그아웃 없이 토큰 마이그레이션 되는지 확인.
4. Sentry / CloudWatch 에서 첫 24시간 401/429/INVALID_TOKEN 비율 모니터링.
5. Phase 3 항목은 각각 별도 PR 로 진행.
