# Backend — Spring Boot 3

## 패키지 구조
com.arrivallab.pawprint/
├── domain/
│   ├── user/           # controller, service, repository, entity, dto
│   ├── pet/
│   ├── record/         # 진료기록
│   ├── diary/          # 건강 다이어리
│   ├── vaccine/        # 예방접종
│   ├── food/           # 먹이/알러지
│   ├── hospital/       # 응급병원 (카카오 API 프록시)
│   ├── share/          # 케어 공유
│   ├── community/      # 커뮤니티
│   └── subscription/   # 구독/결제
├── global/
│   ├── config/         # SecurityConfig, JwtConfig, S3Config, FcmConfig, WebConfig
│   ├── exception/      # GlobalExceptionHandler, ErrorCode enum, BusinessException
│   ├── response/       # ApiResponse<T> record
│   └── util/
└── infra/
    ├── ocr/            # Claude Vision API 연동
    ├── fcm/            # Firebase 푸시 알림
    └── storage/        # AWS S3 파일 업로드

## 공통 응답 포맷
모든 API는 ResponseEntity<ApiResponse<T>> 반환.
ApiResponse<T>: { success: boolean, message: String, data: T }

## 예외 처리
BusinessException(ErrorCode) → GlobalExceptionHandler → ApiResponse.error(message).
ErrorCode enum 필수 항목:
PREMIUM_REQUIRED(402, '프리미엄 구독이 필요한 기능입니다.')
PET_LIMIT_EXCEEDED(402, '무료 플랜은 최대 3마리까지 등록 가능합니다.')
OCR_LIMIT_EXCEEDED(402, '무료 플랜은 월 3회까지 OCR을 사용할 수 있습니다.')
ATTACHMENT_LIMIT_EXCEEDED(402, '무료 플랜은 사진을 건당 2장까지 첨부할 수 있습니다.')
PHOTO_LIMIT_EXCEEDED(402, '무료 플랜은 사진을 건당 2장까지 첨부할 수 있습니다.')
VACCINE_ALERT_LIMIT_EXCEEDED(402, '무료 플랜은 예방접종 알림을 2개까지 설정할 수 있습니다.')
SHARE_LIMIT_EXCEEDED(402, '무료 플랜은 1명까지 공유할 수 있습니다.')
FILE_TOO_LARGE(400, '파일 크기는 10MB를 초과할 수 없습니다.')
INVALID_FILE_TYPE(400, '지원하지 않는 파일 형식입니다.')
UNAUTHORIZED(401, '로그인이 필요합니다.')
FORBIDDEN(403, '접근 권한이 없습니다.')
NOT_FOUND(404, '리소스를 찾을 수 없습니다.')

## @Premium AOP
@Premium 어노테이션 + PremiumAspect.
@Around → 현재 유저 subscription_type 확인 → FREE면 BusinessException(PREMIUM_REQUIRED).

## 환경변수 (application-local.yml)
spring.datasource.url: jdbc:postgresql://localhost:5432/pawprintdb
spring.datasource.username: ${DB_USER:dev}
spring.datasource.password: ${DB_PASSWORD:dev}
spring.jpa.hibernate.ddl-auto: validate
spring.flyway.enabled: true
jwt.secret: ${JWT_SECRET}
jwt.access-expiration: 86400000    # 24시간
jwt.refresh-expiration: 2592000000 # 30일
gemini.api-key: ${GEMINI_API_KEY}
aws.s3.bucket: pawprint-files
aws.s3.region: ap-northeast-2
aws.s3.access-key: ${AWS_ACCESS_KEY}
aws.s3.secret-key: ${AWS_SECRET_KEY}
kakao.api-key: ${KAKAO_API_KEY}    # 백엔드 전용. 프론트 노출 절대 금지.
firebase.credentials-path: ${FCM_CREDENTIALS_PATH}
google.client-id: ${GOOGLE_CLIENT_ID}
google.play.credentials-path: ${PLAY_DEVELOPER_API_JSON:}
google.play.package-name: com.arrivallab.pawprint
apple.bundle-id: com.arrivallab.pawprint
apple.shared-secret: ${APPLE_SHARED_SECRET:}

## 로컬 실행
docker compose -f docker-compose-local.yml up -d   # PostgreSQL
./gradlew bootRun --args='--spring.profiles.active=local'
GET http://localhost:8080/actuator/health → { status: UP }

## Dev 전용 엔드포인트 (@Profile("local") — 프로덕션 빌드에 미포함)
POST /api/auth/dev-login → dev@pawprint.local PREMIUM 유저 생성(없으면) 후 토큰 발급.
프론트 __DEV__ 버튼과 쌍. Google OAuth 없이 전체 기능 테스트 가능.
