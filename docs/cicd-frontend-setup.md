# 프론트엔드 CI/CD 세팅 가이드

`.github/workflows/deploy-frontend.yml` 가 동작하려면 외부 절차로 자격증명 3종 등록 필요.
완료 후 main 에 push 만 하면 자동으로 build + submit.

## 동작 흐름 요약
1. main 에 push (frontend/** 변경) → workflow trigger
2. 마지막 production 빌드 commit ~ HEAD 사이 git diff 검사
3. **네이티브 영향 파일 변경 있음** → iOS + Android EAS build → 양쪽 스토어 자동 submit
4. **변경 없음** → EAS update (OTA) 만 발행, 스토어 거치지 않음

수동 trigger 시 `mode` input 으로 `build`/`update`/`auto` 선택 가능.

---

## 1. EXPO_TOKEN — GitHub Secret 등록

EAS CLI 가 비대화식으로 동작하려면 expo.dev access token 필요.

### 발급
1. [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) 접속
2. `Create token` → 이름 `paw-print github actions` 정도
3. 생성된 토큰 **한 번만 표시되니 바로 복사**

### 등록
1. GitHub repo → Settings → Secrets and variables → Actions
2. `New repository secret`
3. Name: `EXPO_TOKEN`, Value: 위에서 복사한 토큰

> dear-m-i 에 이미 등록돼 있으면 같은 토큰 재사용 가능 (계정 동일).

---

## 2. iOS — App Store Connect API Key (.p8)

### 발급
1. [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Users and Access → **Integrations** 탭 → **App Store Connect API**
2. `+` 버튼 → Key Name `EAS Submit` 정도, Access: **App Manager**
3. 생성 후 표시되는 정보 3개 확보:
   - **Issuer ID** (탭 상단)
   - **Key ID** (목록의 ID 컬럼)
   - **.p8 파일** — 다운로드 (한 번만 가능)

### EAS 에 등록
로컬에서 (대화식):
```bash
cd frontend
eas credentials --platform ios
```
- "App Store Connect: Manage your API Key" 선택
- 위에서 받은 Issuer ID / Key ID / .p8 경로 입력
- 등록 후 EAS 클라우드에 안전하게 저장됨 (로컬 .p8 은 삭제 OK)

### eas.json 확인
이미 `submit.production.ios.ascAppId: "6762686771"` + `appleTeamId: "RNB85R7469"` 적용됨.
ASC API Key 가 등록되면 별도 설정 불필요.

---

## 3. Android — Google Play Service Account JSON

### 사전: Play Console 에 앱 등록 + 최소 한 번 수동 업로드
**자동 submit 은 Play Console 에 앱이 등록돼 있고 최소 1번은 수동으로 AAB 가 올라가 있어야 작동.**
- Play Console → 앱 만들기 → `com.arrivallab.pawprint` 패키지명으로 생성
- 첫 빌드 AAB 는 수동으로 internal testing track 에 업로드 (이번 push 후 EAS 빌드 결과물 다운받아서)
- 두 번째 빌드부터 EAS submit 으로 자동 가능

### Service Account 생성
1. [Play Console](https://play.google.com/console) → Setup → **API access**
2. (처음이면) Linked Google Cloud Project 만들기 안내 → 진행
3. `Create new service account` → Google Cloud Console 새 탭 열림
4. Cloud Console:
   - 이름: `paw-print-publisher` 정도
   - Done → 생성된 SA 클릭 → **Keys** 탭 → Add key → JSON → 다운로드
5. Play Console 로 돌아와서 → 방금 만든 SA 옆 **Grant access**
   - App permissions: paw-print 추가
   - Account permissions: **Release manager** (또는 Admin)
   - Invite user → Save

### EAS 에 등록
```bash
cd frontend
eas credentials --platform android
```
- "Google Service Account" → "Manage your Google Service Account Key for Play Store submissions"
- 다운받은 JSON 파일 경로 입력
- 등록 후 EAS 클라우드 저장. 로컬 JSON 은 즉시 삭제 (커밋되지 않도록).

### eas.json 확인
이미 `submit.production.android` 에 track=internal, releaseStatus=draft 설정됨.

**`releaseStatus: "draft"`** 의미: AAB 가 internal track 에 올라가지만 자동 출시 안 됨. Play Console 에서 검토 후 수동으로 release 버튼. 운영 안정화 후 `inProgress` 또는 production track 으로 변경.

---

## 4. 검증

세팅 끝나면 frontend/ 에 작은 변경(예: 텍스트 한 줄 수정) push:

### OTA 시나리오
- TypeScript/JSX 만 변경 → workflow 가 "No native-affecting changes" 로그 출력 → `eas update` 한 줄 실행 → 끝
- 사용자 단말은 다음 앱 실행 시 자동 업데이트

### Build + Submit 시나리오
- package.json 또는 app.json 변경 → "Native-affecting files changed" 로그 → `eas build --platform all` → 양쪽 submit
- iOS: TestFlight 에 자동 등록, 베타 테스터 알림
- Android: internal track 에 draft 상태로 올라감 → Play Console 에서 release 확인 후 promote

### 수동 trigger
GitHub repo → Actions → Deploy Frontend → Run workflow → mode 선택:
- `auto`: 기본 git diff 분기
- `build`: 강제 풀빌드 (예: 의존성 변경 없지만 새 빌드 원할 때)
- `update`: 강제 OTA (네이티브 변경 있어도 update 만)

---

## 5. 문제 해결

### "ENOENT: gradlew not found" 비슷한 prebuild 누락 에러
→ android/ 또는 ios/ 디렉토리가 git 에 다시 들어왔는지 확인. `.gitignore` 에 `/android/` `/ios/` 가 명시되어 있어야 EAS 가 managed workflow 로 감지하고 자동 prebuild.

### "Unable to find ASC App" submit 실패
→ App Store Connect 에 앱이 아직 안 만들어졌거나 ascAppId 오타. 위 ASC App ID = `6762686771` 정확한지 확인.

### "Service Account does not have access" Android submit 실패
→ Play Console → API access 에서 SA 의 App permissions 에 paw-print 가 포함됐는지 확인. Account permission 에 Release manager 이상 권한 있어야 함.

### 빌드는 성공했는데 submit 단계만 실패
→ workflow 안에서 submit step 만 실패해도 build artifact 는 EAS 대시보드에 남아있음. 수동으로 `eas submit --platform <ios|android> --latest` 재시도 가능.

---

## 6. 운영 안정화 후 권장 조정

| 항목 | 초기값 | 안정화 후 |
|---|---|---|
| Android track | `internal` | `production` (with staged rollout) |
| Android releaseStatus | `draft` | `inProgress` (5% 자동 출시) |
| iOS submit | TestFlight (기본) | App Store Connect 의 자동 출시 룰 설정 |

production 자동 promotion 은 신뢰가 쌓인 후 단계적으로. 1인 운영 베타기엔 internal/TestFlight 로 두고 수동 promote 가 안전.
