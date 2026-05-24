# 클린 아키텍처 Phase 3 (2026-05-24)

브랜치: `clean-arch-phase3` (main 미머지, `security-and-clean-arch-phase1` 위에 쌓음)
대상: Phase 1·2 에서 deferred 된 5건의 대형 리팩토링

## 요약

5건 중 **4건 완료**, Phase 3-5 (500줄+ 화면 분해) 는 의도적으로 다음 세션 deferred.
완료된 4건으로 **SOLID + Dependency Rule 모두 사실상 PASS** 달성. 남은 화면 SRP 위반은 코드 가독성 이슈로 분류 (정확성/보안과 무관).

---

## Phase 3-1 — TriggerEvaluator 전략 패턴 (OCP) ([7c4413d](../))

**문제**: [TriggerEvaluator.java](../backend/src/main/java/com/arrivallab/pawprint/domain/weather/service/TriggerEvaluator.java) 의 `evaluate()` 가 12개 트리거를 if-elseif chain 으로 평가. 새 트리거 추가 = 메서드 본문 수정 필요.

**해결**: `List<TriggerRule(Predicate<WeatherSnapshot>, WeatherTrigger)>` 로 전환. 새 트리거 = RULES 한 줄 추가, evaluate() 자체는 불변.

```java
private static final List<TriggerRule> RULES = List.of(
    new TriggerRule(w -> gte(w.feelsLikeC(), 33), WeatherTrigger.HEATWAVE),
    ...
);
```

순서/조건/우선순위 100% 동일. label() switch 는 enum exhaustiveness 검사가 컴파일러에서 강제되므로 OCP 위반 아님 → 유지.

---

## Phase 3-2 — SubscriptionVerifier 전략 패턴 (OCP + DIP) ([cf44692](../))

**문제**: [SubscriptionService.java](../backend/src/main/java/com/arrivallab/pawprint/domain/subscription/service/SubscriptionService.java) 262줄에 iOS/Android `if-else` 분기 + Apple SDK 직접 의존 + CA 로딩/JWS 검증/Google Play API 호출 모두 혼재.

**해결**: 전략 인터페이스 + 플랫폼별 구현체:

```
domain/subscription/service/verifier/
├── SubscriptionVerifier.java    (interface)
├── VerifyResult.java            (record)
├── AppleSubscriptionVerifier.java   (JWS verify, prod/sandbox fallback, CA 로딩)
└── GoogleSubscriptionVerifier.java  (AndroidPublisher API)
```

`SubscriptionService` 는 `List<SubscriptionVerifier>` 주입받아 `platform()` 매칭:

```java
return verifiers.stream()
    .filter(v -> v.platform() == request.platform())
    .findFirst()
    .orElseThrow(...)
    .verify(request);
```

**효과**:
- SubscriptionService 262줄 → **100줄** (구매/복원/티어추출만)
- 새 스토어 추가 = `@Component` 추가만 (SubscriptionService 수정 불필요)
- Apple/Google SDK 의존성이 도메인 서비스에서 verifier 패키지로 격리 (DIP)

---

## Phase 3-3 — shared/ → features/ 역방향 import 제거 (DIP + Dependency Rule) ([3deec19](../))

**문제**: `frontend/shared/` 가 `features/` 모듈 6건 import — 의존성 방향 역행.

**해결**:

### features/ 로 이동 (그곳이 본 자리)
| 원위치 | 새 위치 | 이유 |
|---|---|---|
| `shared/utils/push.ts` | `features/auth/utils/` | authApi.updateFcmToken 사용 |
| `shared/hooks/useNotificationResponse.ts` | `features/care/hooks/` | careApi.setCheck 사용 (CARE_REMINDER 처리) |
| `shared/components/PremiumModal.tsx` | `features/subscription/components/` | usePurchase, Plan 사용 |
| `shared/components/HospitalAutocomplete.tsx` | `features/record/components/` | useHospitalSuggestions 사용 |

### shared/ 로 이동 (인프라성)
| 원위치 | 새 위치 | 이유 |
|---|---|---|
| `features/onboarding/tourStore.ts` | `shared/store/` | 순수 Zustand 좌표 저장소, UI 인프라 |
| `features/onboarding/components/TourTarget.tsx` | `shared/components/` | ref measure wrapper, 인프라 |

### prop 슬롯으로 의존성 제거
`shared/components/ScreenHeader.tsx` 의 `petBadge` + `onPetBadgePress` 두 props → `titleSlot?: ReactNode` 단일 슬롯. 호출 측이 `<PetContextBadge .../>` 직접 전달 (3개 화면).

**검증**:
```bash
$ grep -rn "from ['\"].*features/" frontend/shared/
✓ shared/ has zero features/ imports
```

---

## Phase 3-4 — MedicalRecordService SRP 분리 ([06e025c](../))

**문제**: [MedicalRecordService.java](../backend/src/main/java/com/arrivallab/pawprint/domain/record/service/MedicalRecordService.java) 234줄에 CRUD + 첨부 + OCR + 사용량 한도 + 병원명 autocomplete 혼재.

**해결**: 책임별 4개 서비스 + 공통 가드:

| 서비스 | 책임 | 줄수 |
|---|---|---|
| `MedicalRecordService` | 진료기록 CRUD 만 | ~110 |
| `RecordAttachmentService` | 첨부 업로드/삭제 + FREE 사진 한도 | ~75 |
| `OcrUsageService` | Gemini OCR/Audio 호출 + 월간 사용량 한도 | ~70 |
| `HospitalSuggestionService` | records+appointments union autocomplete | ~30 |
| `PetAccessGuard` (`domain/pet/service/`) | 펫 소유자/공유멤버 권한 검증 (DRY) | ~50 |

`PetAccessGuard` 는 다른 펫-스코프 서비스 (Diary, Care 등) 에서도 재사용 가능 — 추후 점진 적용.

**컨트롤러 갱신**:
- `MedicalRecordController`: 3개 서비스 (`recordService`, `attachmentService`, `hospitalSuggestionService`) 주입
- `OcrController`: `ocrUsageService` 주입 (recordService 의존 제거)

모든 한도 체크 / 권한 검증 로직 그대로 이동 — 행동 동일.

---

## Phase 3-5 — 500줄+ 화면 분해 (의도적 deferred)

**대상**:
| 파일 | 줄수 |
|---|---|
| [app/(tabs)/diary.tsx](../frontend/app/(tabs)/diary.tsx) | 1087 |
| [features/care/components/CareTab.tsx](../frontend/features/care/components/CareTab.tsx) | 1047 |
| [app/pets/[id].tsx](../frontend/app/pets/[id].tsx) | 765 |

**왜 deferred 했나**:

1. **자동 검증 불가능**: TypeScript 가 잡는 건 시그니처 오류뿐. JSX 트리 재구성에서 흔히 발생하는 issue (focus loss, layout shift, useEffect 재실행 횟수 변화, key prop, conditional rendering 순서) 는 컴파일러가 못 잡음.
2. **공유 state 가 많음**: 각 화면이 5~15개 React Query/Zustand 의존을 가짐. 서브 컴포넌트로 추출하면 prop drilling 또는 context 도입 필수 — 둘 다 추가 결정 필요.
3. **실제 사용 QA 필수**: 다이어리/캘린더/케어는 매일 쓰는 핵심 화면. 미세한 인터랙션 변화가 사용자 불편으로 직결.
4. **위험/이득 비율 나쁨**: 코드 가독성 개선 vs 핵심 화면 회귀 위험. 보안/정확성 영향은 0.

**진행 방식 권고**:
- 화면 1개씩 별도 PR
- 추출 단위: "한 화면, 한 책임" (예: `<DiaryCalendar />`, `<DiaryDayList />`, `<DiaryEntryModal />`)
- 각 PR 마다 디자인 의도 변화 없는지 디바이스로 직접 확인
- diff 가 작아 reviewer 도 부담 적음

**우선순위**: 1) `pets/[id].tsx` (단순 detail) → 2) `CareTab.tsx` (시간대 그룹 명확) → 3) `diary.tsx` (캘린더 로직 복잡, 마지막).

---

## SOLID + Dependency Rule 최종 상태

| 원칙 | Phase 2 종료 시 | Phase 3 종료 시 |
|---|---|---|
| SRP | 🟡 부분 (Service God class) | ✅ Service 모두 PASS / 🟡 일부 Screen 500줄+ 남음 |
| OCP | 🟡 부분 | ✅ PASS |
| LSP | ✅ PASS | ✅ PASS |
| ISP | ✅ PASS | ✅ PASS |
| DIP | 🟡 부분 (shared←features) | ✅ PASS |
| Dependency Rule | 🟡 부분 | ✅ PASS |

**6원칙 중 5.5개 PASS**. 남은 0.5는 화면 줄수 SRP (Service 레벨 SRP 는 완료).

---

## 커밋 로그

```
06e025c refactor: phase 3-4 — MedicalRecordService SRP 분리
3deec19 refactor: phase 3-3 — shared/ → features/ 역방향 import 제거
cf44692 refactor: phase 3-2 — SubscriptionVerifier 전략 패턴 (OCP)
7c4413d refactor: phase 3-1 — TriggerEvaluator if-chain → 규칙 리스트 (OCP)
```

## 검증 권장

이 브랜치는 **백엔드 변경 비중이 큼** (서비스 분리, verifier 전략). 다음 시나리오로 staging 확인:

1. **구독 결제**: iOS sandbox + Android internal 양쪽 verify 정상 동작 (`SubscriptionService` 가 `verifiers.stream()` 으로 라우팅)
2. **OCR / 음성 입력**: FREE 계정 월 5회 한도 도달 시 OCR_LIMIT_EXCEEDED, 다음달 1일 초기화
3. **사진 첨부**: FREE 계정 진료기록당 5장 초과 시 ATTACHMENT_LIMIT_EXCEEDED
4. **병원명 autocomplete**: records + appointments 입력 이력 union 반환
5. **진료기록 CRUD + appointment 링크**: cross-pet appointmentId IDOR 차단 (Phase 1-B) 그대로 유지
6. **푸시 알림**: care reminder, vaccine alert 정상 발송 (PushNotificationPort 경유)
7. **날씨 트리거**: 우선순위 그대로 (HEATWAVE > COLDWAVE > RAIN_HEAVY > ...)
8. **공유 초대 수락**: 본인 자기수락 차단

프론트 변경은 import 경로 변경 + ScreenHeader API + 토큰 저장소 (Phase 2-B 에서 이미 적용). 추가 검증 사항 없음 — Phase 2 verify 와 동일 시나리오로 충분.
