# Backend — Spring Boot 3

## 패키지 구조
```
com.arrivallab.pawprint/
├── domain/
│   ├── auth/           # OAuth2, JWT 발급, dev-login
│   ├── user/           # controller, service, repository, entity, dto
│   ├── pet/
│   ├── record/         # 진료기록
│   ├── diary/          # 건강 다이어리 (HealthDiary, DiaryPhoto, DiaryTag, HealthMetric)
│   ├── vaccine/        # 예방접종
│   ├── food/           # 먹이/알러지
│   ├── hospital/       # 응급병원 (카카오 API 프록시)
│   ├── share/          # 케어 공유 (ShareMember + ShareStatus)
│   ├── community/      # 커뮤니티
│   └── subscription/   # 구독/결제
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
    ├── fcm/            # Firebase 푸시 알림
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

firebase.credentials-path: ${FCM_CREDENTIALS_PATH}
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

## 로컬 실행
```bash
docker compose -f docker-compose-local.yml up -d   # PostgreSQL
./gradlew bootRun --args='--spring.profiles.active=local'
curl http://localhost:8080/actuator/health         # { "status": "UP" }
```

## Dev 전용 엔드포인트
`POST /api/auth/dev-login` (`DevAuthController`) — `dev@pawprint.local` PREMIUM 유저 생성(없으면) 후 토큰 발급. 프론트 `__DEV__` 버튼과 쌍. Google OAuth 없이 전체 기능 테스트 가능.

> ⚠️ 현재 `@Profile("local")` 제한을 풀어둠 — 앱 dev 빌드를 prod 백엔드와 함께 쓰기 위한 임시 조치. **공개 출시 전 반드시 `@Profile("local")` 복귀 또는 컨트롤러 삭제**.

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
