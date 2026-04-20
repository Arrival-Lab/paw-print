# 발자국 (Paw Print)

반려동물 보호자용 진료기록 · 건강 추적 · 커뮤니티 모바일 앱

| 역할 | 담당 |
|------|------|
| 기획 · 프론트엔드 · 백엔드 | 채연 |
| 인프라 | 도아 |
| 디자인 | 도아의 애착인형 |

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [프로젝트 클론](#2-프로젝트-클론)
3. [프론트엔드 실행](#3-프론트엔드-실행)
   - [Expo Go로 실기기 테스트](#expo-go로-실기기-테스트-가장-빠름)
   - [Android Studio 에뮬레이터](#android-studio-에뮬레이터)
   - [iOS 시뮬레이터 (Mac 전용)](#ios-시뮬레이터-mac-전용)
4. [백엔드 실행](#4-백엔드-실행)
5. [프론트 + 백엔드 함께 실행](#5-프론트--백엔드-함께-실행)
6. [자주 묻는 문제](#6-자주-묻는-문제)

---

## 1. 사전 준비

### 필수 설치

| 도구 | 버전 | 설치 링크 |
|------|------|-----------|
| Node.js | 20 LTS 이상 | https://nodejs.org |
| Git | 최신 | https://git-scm.com |
| Java JDK | 17 | https://adoptium.net |
| Docker Desktop | 최신 | https://www.docker.com/products/docker-desktop (백엔드 DB용) |

### 프론트엔드 테스트 방법별 추가 설치

**Expo Go (실기기) — 가장 간단**
- 스마트폰에 [Expo Go](https://expo.dev/go) 앱 설치 (iOS / Android 모두 가능)
- PC와 폰이 **같은 Wi-Fi**에 연결되어 있어야 함

**Android Studio 에뮬레이터**
- [Android Studio](https://developer.android.com/studio) 설치
- Android Studio 열기 → `More Actions` → `Virtual Device Manager` → 에뮬레이터 1개 생성
  - 권장: Pixel 8 / API 34 (Android 14)

**iOS 시뮬레이터 (Mac 전용)**
- Xcode 설치 (App Store)
- `xcode-select --install` 실행

---

## 2. 프로젝트 클론

```bash
git clone <repo-url>
cd paw-print
```

---

## 3. 프론트엔드 실행

### 패키지 설치

```bash
cd frontend
npm install
```

### 환경변수 설정

```bash
cp .env.example .env
# 백엔드 없이 UI만 볼 때는 기본값 그대로 둬도 됨
```

### 앱 시작

```bash
npm start
```

터미널에 QR 코드와 함께 아래 옵션이 표시됩니다:

```
› Press a │ open Android
› Press i │ open iOS simulator
› scan QR │ open in Expo Go
```

---

### Expo Go로 실기기 테스트 (가장 빠름)

1. `npm start` 실행
2. 터미널에 표시된 **QR 코드**를 스캔
   - Android: Expo Go 앱 실행 → `Scan QR code`
   - iPhone: 기본 카메라 앱으로 스캔
3. 자동으로 앱 로드됨

> **주의:** PC와 폰이 같은 Wi-Fi에 있어야 합니다. 학교·회사 네트워크처럼 기기 간 통신이 막힌 경우 터미널에서 `s` 키를 눌러 터널 모드로 전환하세요.

---

### Android Studio 에뮬레이터

1. Android Studio에서 에뮬레이터를 먼저 실행
   - `Virtual Device Manager` → 재생 버튼(▶)

2. 에뮬레이터가 켜진 상태에서:

```bash
npm start
# 터미널에서 a 키 입력
```

3. 에뮬레이터에 자동으로 앱이 설치되고 실행됨

> **첫 실행 시** 앱 빌드에 1~2분 소요됩니다. 이후 재실행은 빠릅니다.

#### Android Studio 경로 설정 (Windows, 처음 한 번만)

`adb` 명령어를 찾지 못하는 경우 시스템 환경변수 `Path`에 추가:

```
C:\Users\<사용자명>\AppData\Local\Android\Sdk\platform-tools
```

---

### iOS 시뮬레이터 (Mac 전용)

```bash
npm start
# 터미널에서 i 키 입력
```

---

## 4. 백엔드 실행

### 사전 준비

```bash
java -version   # 17 이상인지 확인
docker info     # Docker Desktop 실행 중인지 확인
```

### DB 실행 (Docker)

```bash
cd backend
docker compose -f docker-compose-local.yml up -d
```

PostgreSQL 16이 localhost:5432에 올라옵니다 (`pawprintdb` / `dev` / `dev`).

헬스체크 확인:
```bash
docker compose -f docker-compose-local.yml ps
# postgres 컨테이너 STATUS가 healthy 인지 확인
```

### 환경변수 설정

```bash
cp application-local.yml.example src/main/resources/application-local.yml
```

`application-local.yml`을 열어 아래 항목을 채웁니다 (팀 노션 > 개발환경 설정 참고):

| 항목 | 설명 | 로컬 기본값 |
|------|------|------------|
| `spring.datasource.*` | PostgreSQL 접속 정보 | Docker 기본값으로 동작 |
| `jwt.secret` | JWT 서명 키 (256bit 이상) | 파일에 기본값 포함 |
| `claude.api-key` | Anthropic API 키 | OCR 미사용 시 비워도 됨 |
| `aws.s3.*` | S3 접속 정보 | 파일 업로드 미사용 시 비워도 됨 |
| `kakao.api-key` | 카카오 로컬 API | 응급병원 미사용 시 비워도 됨 |
| `firebase.credentials-path` | FCM 서비스 계정 키 경로 | 알림 미사용 시 비워도 됨 |

> `jwt.secret`은 파일에 로컬 개발용 기본값이 포함되어 있어 별도 설정 없이 실행 가능합니다.

### 서버 시작

```bash
# Mac / Linux
./gradlew bootRun --args='--spring.profiles.active=local'

# Windows
gradlew.bat bootRun --args='--spring.profiles.active=local'
```

처음 실행 시 Gradle이 의존성을 다운로드하므로 3~5분 소요됩니다.

### 서버 정상 확인

```bash
curl http://localhost:8080/actuator/health
# 응답: {"status":"UP"}
```

브라우저에서 확인: http://localhost:8080/actuator/health

### DB 종료

```bash
docker compose -f docker-compose-local.yml down
# 데이터 초기화까지 하려면:
docker compose -f docker-compose-local.yml down -v
```

---

## 5. 프론트 + 백엔드 함께 실행

백엔드 서버를 먼저 띄운 뒤 프론트 `frontend/.env`의 `EXPO_PUBLIC_API_BASE_URL`을 설정합니다.

| 실행 환경 | API URL 설정 |
|-----------|-------------|
| 실기기 (Expo Go) | `http://<내PC의IP>:8080` |
| Android 에뮬레이터 | `http://10.0.2.2:8080` |
| iOS 시뮬레이터 | `http://localhost:8080` |

#### 내 PC IP 확인 방법

```bash
# Mac / Linux
ipconfig getifaddr en0

# Windows
ipconfig | findstr "IPv4"
```

`.env` 수정 후 Expo 개발 서버를 재시작해야 반영됩니다 (`r` 키 또는 `npm start` 재실행).

---

## 6. 자주 묻는 문제

**Q. `Metro bundler`가 무한 로딩됩니다**
```bash
npx expo start --clear
```

**Q. Android 에뮬레이터에서 `Unable to load script` 오류**
```bash
adb reverse tcp:8081 tcp:8081
```

**Q. `react-native-mmkv` 빌드 오류**
- MMKV는 네이티브 모듈이라 일반 Expo Go에서는 실행이 안 됩니다.
- EAS Dev Build가 필요합니다. 채연에게 문의하세요.

**Q. `Cannot find module 'expo-router/entry'` 오류**
```bash
cd frontend && npm install
```

**Q. Android 에뮬레이터에서 백엔드 API 연결이 안 됩니다**
- `.env`의 `EXPO_PUBLIC_API_BASE_URL`을 `http://10.0.2.2:8080`으로 설정하세요.
- 에뮬레이터에서 `localhost`는 PC가 아니라 에뮬레이터 자신을 가리킵니다.

**Q. `gradlew: Permission denied` (Mac/Linux)**
```bash
chmod +x backend/gradlew
```

**Q. Gradle 빌드 중 OOM(Out of Memory) 오류**
```bash
# backend/gradle.properties 에 이미 설정되어 있음. 그래도 발생하면:
export GRADLE_OPTS="-Xmx2g"
./gradlew bootRun --args='--spring.profiles.active=local'
```

**Q. Flyway 마이그레이션 오류 (`Found non-empty schema`)****
```bash
# DB를 완전히 초기화하고 다시 시작
docker compose -f docker-compose-local.yml down -v
docker compose -f docker-compose-local.yml up -d
```
