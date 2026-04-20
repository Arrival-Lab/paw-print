# 발자국 (Paw Print)

## 프로젝트
팀: Arrival Lab | 풀스택 개발: 채연(기획+프론트+백엔드) | 인프라: 도아 | 디자인: 도아의 애착인형
반려동물 보호자용 진료기록·건강 추적·커뮤니티 모바일 앱.
App Store + Google Play 동시 출시.

## 절대 규칙 (위반 금지)
1. 컬러·폰트·간격·가격 등 모든 상수 → frontend/constants/ 에서만 import. 컴포넌트 안에 하드코딩 절대 금지.
2. NativeWind className 안에도 hex 코드 직접 입력 금지. tailwind.config.js에 Colors 연동해서 사용.
3. 비즈니스 로직은 UI 컴포넌트에 넣지 않는다. Service/Hook/Store에 분리.
4. API URL·서버 주소·외부 키는 환경변수에서만. 소스코드에 하드코딩 절대 금지.
5. 카카오 API 키는 백엔드 환경변수에만. 프론트 EXPO_PUBLIC_ 에 절대 노출 금지.
6. 모든 API 호출은 frontend/shared/api/client.ts 인스턴스만 사용.
7. StyleSheet 사용 금지. 모든 스타일은 NativeWind className.

## 기술 스택
Frontend: React Native (Expo SDK 51+) + TypeScript + NativeWind v4 + React Query v5 + Zustand v4 + MMKV + react-hook-form + zod + EAS Build
Backend: Spring Boot 3 + Java 17 + PostgreSQL 16 (AWS RDS) + JPA + Flyway + JWT + OAuth2 + FCM + AWS S3 + Claude Vision API
인프라: AWS (EC2 or ECS Fargate — 도아 결정) + RDS db.t3.micro + S3 버킷(pawprint-files) + CloudWatch
결제: App Store IAP + Google Play Billing (expo-iap)

## 무료/프리미엄 제한 (백엔드 @Premium AOP + 프론트 402→PremiumModal)
반려동물 프로필: 무료 3마리 / 프리미엄 무제한
사진 첨부: 무료 건당 2장 / 프리미엄 무제한
OCR 파싱: 무료 월 3회 / 프리미엄 무제한
수치 트래킹 그래프: 무료 1개월치 / 프리미엄 무제한
예방접종 알림: 무료 2개 / 프리미엄 무제한
가족/친구 케어 공유: 무료 1명 / 프리미엄 무제한
진료기록·다이어리·커뮤니티·응급병원: 무료/프리미엄 모두 무제한
