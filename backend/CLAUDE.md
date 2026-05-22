# Backend — Spring Boot 3

## 패키지 구조
```
com.arrivallab.pawprint/
├── domain/
│   ├── auth/           # OAuth2, JWT 발급, dev-login
│   ├── user/           # controller, service, repository, entity, dto
│   ├── pet/            # Pet + sharedMemberCount (ACCEPTED 멤버 수) 응답에 포함
│   ├── record/         # 진료기록 (MedicalRecord) + appointment_id FK
│   ├── appointment/    # 진료일정 (Appointment) + linkedRecordId 응답에 포함
│   ├── diary/          # 건강 다이어리 (HealthDiary, DiaryPhoto, DiaryTag, HealthMetric)
│   ├── vaccine/        # 예방접종
│   ├── food/           # 먹이/알러지
│   ├── hospital/       # 응급병원 (카카오 API 프록시)
│   ├── share/          # 케어 공유 (ShareMember + ShareStatus)
│   ├── community/      # 커뮤니티
│   ├── subscription/   # 구독/결제
│   └── weather/        # 날씨 기반 케어 팁 (KMA 기상청 + KECO 대기질)
├── global/
│   ├── annotation/     # @Premium 등 커스텀 어노테이션
│   ├── aop/            # PremiumAspect — @Around 로 구독 검사
│   ├── config/         # SecurityConfig, JwtConfig, S3Config, FcmConfig, WebConfig
│   ├── entity/         # BaseTimeEntity 등 공통 엔티티
│   ├── exception/      # GlobalExceptionHandler, ErrorCode, BusinessException
│   ├── response/       # ApiResponse<T>, PageResponse<T>
│   └── security/       # JwtTokenProvider, JwtAuthenticationFilter, CustomUserDetailsService
└── infra/
    ├── ocr/            # GeminiOcrService — Gemini Vision API 연동
    ├── fcm/            # Firebase 푸시 알림 (현재 미사용 — Expo Push Service 로 대체. 클래스는 유지.)
    └── storage/        # LocalFileStorageService (local) / S3FileStorageService (prod)
```

## 공통 응답 포맷
모든 API는 `ResponseEntity<ApiResponse<T>>` 반환.
```java
ApiResponse<T> { boolean success; String message; T data; }
```

## 예외 처리
`BusinessException(ErrorCode)` → `GlobalExceptionHandler` → `ApiResponse.error(message)`.

`ErrorCode` 주요 항목:
```
PREMIUM_REQUIRED(402)           PET_LIMIT_EXCEEDED(402)
OCR_LIMIT_EXCEEDED(402)         ATTACHMENT_LIMIT_EXCEEDED(402)
PHOTO_LIMIT_EXCEEDED(402)       VACCINE_ALERT_LIMIT_EXCEEDED(402)
SHARE_LIMIT_EXCEEDED(402)
FILE_TOO_LARGE(400)             INVALID_FILE_TYPE(400)
UNAUTHORIZED(401)               FORBIDDEN(403)             NOT_FOUND(404)
RECORD_NOT_FOUND(404)           PET_NOT_FOUND(404)         USER_NOT_FOUND(404)
```

## @Premium AOP
`@Premium` 어노테이션 + `PremiumAspect`. `@Around` → 현재 유저 `subscription_type` 확인 → FREE 면 `BusinessException(PREMIUM_REQUIRED)` 던짐 → 프론트에서 402 받아 `PremiumModal` 노출.

## SecurityConfig — JSON 401 EntryPoint
`/api/**` 미인증 요청은 OAuth2 redirect(302) 대신 **JSON 401** 반환:
```json
{ "success": false, "message": "인증이 필요합니다.", "data": null }
```
모바일 클라이언트가 의도치 않게 HTML 로그인 페이지로 따라가지 않도록. `actuator/**` 는 `permitAll`.

## 환경변수 (application-local.yml)
```yaml
spring.datasource.url: jdbc:postgresql://localhost:5432/pawprintdb
spring.datasource.username: ${DB_USER:dev}
spring.datasource.password: ${DB_PASSWORD:dev}
spring.jpa.hibernate.ddl-auto: validate
spring.flyway.enabled: true

jwt.secret: ${JWT_SECRET}
jwt.access-expiration: 86400000      # 24h
jwt.refresh-expiration: 2592000000   # 30d

gemini.api-key: ${GEMINI_API_KEY}    # OCR (Gemini Vision)

aws.s3.bucket: pawprint-files
aws.s3.region: ap-northeast-2
aws.s3.access-key: ${AWS_ACCESS_KEY}
aws.s3.secret-key: ${AWS_SECRET_KEY}

kakao.api-key: ${KAKAO_API_KEY}      # 백엔드 전용. 프론트 노출 금지.

firebase.credentials-path: ${FCM_CREDENTIALS_PATH}   # 현재 미사용 (Expo Push 로 이전)
google.client-id: ${GOOGLE_CLIENT_ID}
google.play.credentials-path: ${PLAY_DEVELOPER_API_JSON:}
apple.bundle-id: com.arrivallab.pawprint
apple.shared-secret: ${APPLE_SHARED_SECRET:}
```

## application-prod.yml — startup 최적화
```yaml
spring.main.lazy-initialization: true   # eager bean 일부 이연. 첫 호출이 살짝 느려지는 대신 startup 단축.
spring.jpa.hibernate.ddl-auto: validate # 스키마는 Flyway 만 관리
```
- prod 컨테이너 startup이 길어서(~180s) ECS service `healthCheckGracePeriodSeconds: 300` 으로 운영 중.
- vCPU 증설은 비용 부담으로 보류.
- ECS service 는 main 브랜치 push 시 자동 배포. Flyway 가 startup 전 마이그레이션 실행.

## 로컬 실행
```bash
docker compose -f docker-compose-local.yml up -d   # PostgreSQL
./gradlew bootRun --args='--spring.profiles.active=local'
curl http://localhost:8080/actuator/health         # { "status": "UP" }
```

**모든 테스트는 배포된 백엔드 사용** (`https://api.pawprintapp.link`). 로컬 백엔드 띄우지 않음 — 프론트 dev 빌드도 prod 백엔드로.

## Dev 전용 엔드포인트
`POST /api/auth/dev-login` (`DevAuthController`) — `dev@pawprint.local` PREMIUM 유저 생성(없으면) 후 토큰 발급. 프론트 `__DEV__` 버튼과 쌍. Google OAuth 없이 전체 기능 테스트 가능.

**`@Profile("local")` 적용** — prod 배포 시 빈 등록 안 됨 (404). 로컬 백엔드 띄울 때만 활성화.

## JPQL 작성 시 주의 — PostgreSQL 파라미터 타입 추론
PostgreSQL 은 prepared statement 컴파일 시 파라미터 타입을 추론해야 함. 다음 패턴은 `could not determine data type of parameter` 런타임 오류 유발:
```jpql
AND (:from IS NULL OR d.diaryDate >= :from)
AND (:keyword IS NULL OR d.content LIKE ...)
```
회피 방법:
1. 가능하면 **Spring Data 파생 메서드명** 사용 (`findByPet_IdAndDiaryDateBetweenOrderByDiaryDateDesc`). JPQL 파싱 단계 자체를 우회.
2. JPQL 이 필요하면 boolean 플래그로 분기 (`(:hasKeyword = false OR ...)`), 빈 컬렉션엔 sentinel 값 (`List.of("__none__")`) 채워서 IN 절 보호.
3. 서비스 레이어에서 null → 안전한 기본값(`LocalDate.MIN/MAX`, 빈 문자열)으로 치환.

## 멀티 펫 집계 쿼리 패턴 — ShareMember 조인
Pet 엔티티에 ShareMember 역방향 매핑이 없어 `LEFT JOIN ShareMember sm ON sm.pet = p` 같은 비표준 조인은 Hibernate 6.5 가 거부 가능 (ECS startup validation 실패 → circuit breaker 롤백).

권장 패턴 — 서브쿼리 + `:status` 파라미터:
```jpql
WHERE (d.pet.user.id = :userId
   OR d.pet.id IN (SELECT sm.pet.id FROM ShareMember sm
                   WHERE sm.member.id = :userId AND sm.status = :status))
```
서비스에서 `ShareStatus.ACCEPTED` 명시 주입.

## 도메인 모델 — 진료일정(Appointment) ↔ 진료기록(MedicalRecord) 양방향 링크
**V20 migration** (`V20__add_appointment_id_to_records.sql`):
- `medical_records.appointment_id BIGINT NULL`
- FK `medical_records.appointment_id → appointments.id ON DELETE SET NULL` — 예약 삭제 시 기록은 살리고 링크만 끊김
- index `idx_medical_records_appointment_id`

**MedicalRecord 측**:
- 엔티티에 `Long appointmentId` 필드 + `linkAppointment(id)` 메서드
- `MedicalRecord{Request,Response,SummaryDto}` 모두 `appointmentId` 포함
- 신규 생성 시에만 prefill 가능 (수정 시 변경 막음 — 프론트 RecordForm 에서 분기)

**Appointment 측**:
- `AppointmentResponse.linkedRecordId` 필드 — `MedicalRecordRepository.findByPet_IdAndAppointmentId` 로 lookup 해서 채움
- `AppointmentService.getAll/getMonth` 모두 채움 (N+1 허용 — 펫당 예약 수가 적음, 보통 5~10개)

## 병원명 autocomplete endpoint
`GET /api/pets/{petId}/records/hospital-suggestions` → `List<String>`
- `MedicalRecordRepository.findDistinctHospitalNamesByPetId` + `AppointmentRepository.findDistinctHospitalNamesByPetId` union
- `LinkedHashSet` 으로 중복 제거하며 순서 유지
- 프론트 `<HospitalAutocomplete>` 에서 사용 (60s staleTime 캐시)

## Pet 응답에 sharedMemberCount 포함
`PetResponse.sharedMemberCount` — 해당 펫에 ACCEPTED 상태로 공유받은 멤버 수 (소유자 제외).
- `PetService.getMyPets/getPet` 가 `ShareMemberRepository.countByPetIdAndStatus` 로 채움 (N+1 허용)
- 프론트 펫 리스트에서 "X명과 공유 중" / "Y님이 공유함" 라벨 표시용

## Flyway migrations (db/migration)
최신: **V20__add_appointment_id_to_records.sql**.
새 migration 추가 시 V21, V22, ... 순차 번호. spring.jpa.hibernate.ddl-auto: validate 라서 Flyway 가 startup 전 적용해야 함.

## 날씨 기반 케어 팁 도메인 (`domain/weather/`)
홈 화면 상단 카드용 — 좌표 받아서 적절한 케어 팁 반환.

엔드포인트: `GET /api/weather/care-tip?lat&lng` → `WeatherTipResponse { trigger, label, weather: WeatherSnapshot }`

서비스 구성:
- `WeatherProvider` 인터페이스 — `KmaWeatherProvider` (실제, 기상청 단기예보 API) 또는 `MockWeatherProvider` (개발/테스트)
- `KmaGridConverter` — 위경도 → 기상청 격자 좌표 변환 (Lambert 투영)
- `KmaWeatherClient` — 기상청 단기예보 API 호출
- `KecoAirClient` — 한국환경공단 대기질 API
- `SidoResolver` — 좌표 → 시도 매핑 (대기질 측정소 조회용)
- `TriggerEvaluator` — 기온·강수·미세먼지 등 조합으로 `WeatherTrigger` 결정 (RAIN/HOT/COLD/AIR_BAD/UV_HIGH/NONE)

`WeatherProperties` 에서 API 키 + 활성 provider 설정. local profile 은 Mock 으로 작동 가능.

## 도메인 확장 메모 — User.nickname
User 엔티티에 `nickname` 필드 추가됨. OAuth 회원가입 직후엔 null — 프론트가 인증 후 `app/_layout.tsx` 가드에서 nickname 비어있으면 닉네임 설정 화면으로 강제 navigate.
