# 발자국 (Paw Print) — 디자이너 전달 문서

팀: Arrival Lab | 앱 이름: 발자국 | 대상: 도아의 애착인형

---

## 브랜드 컬러 (임시값 — 이 파일의 hex 수정 후 전달 요청)

| 역할 | 이름 | hex | 사용처 |
|---|---|---|---|
| 메인 브랜드 | primary | `#7ECFB3` | 탭바 액티브, CTA 버튼, 카드 테두리, 태그 칩 |
| 서브 브랜드 | secondary | `#FFB5A0` | 서브 액션, FAB |
| 메인 연한 배경 | primaryLight | `#E8F8F3` | 카드 배경, 프리미엄 배너 배경 |
| 서브 연한 배경 | secondaryLight | `#FFF0EC` | 보조 배경 |
| 프리미엄 강조 | premium | `#F5D87A` | 프리미엄 배지 배경 |
| 프리미엄 텍스트 | premiumText | `#7A5C00` | 프리미엄 배지 텍스트 |

> **변경 방법**: `frontend/constants/colors.ts` 의 hex 값만 수정하면  
> 탭바·버튼·카드·배지·헤더 전체가 자동 반영됩니다.

---

## 중성 컬러 시스템

| 이름 | hex | 사용처 |
|---|---|---|
| white / background | `#FFFFFF` | 화면 배경, 버튼 배경 |
| surface | `#F8F9FA` | 카드·모달 배경 |
| border | `#F0F0F0` | 구분선, 입력 필드 테두리 |
| text.primary | `#1A1A1A` | 본문 제목 |
| text.secondary | `#666666` | 설명 텍스트, 레이블 |
| text.tertiary | `#999999` | 플레이스홀더, 비활성 |
| text.disabled | `#CCCCCC` | disabled 상태 텍스트 |
| overlay | `rgba(0,0,0,0.5)` | 모달 딤 처리 |

---

## 상태 컬러

| 이름 | hex | 사용처 |
|---|---|---|
| status.success | `#2EAE75` | 성공 메시지, 예방접종 완료 |
| status.warning | `#F5A623` | D-7 이내 예방접종 알림 |
| status.error | `#E53E3E` | 에러, D-Day 초과, 로그아웃 |
| status.info | `#7ECFB3` | 정보 알림 (primary와 동일) |

---

## 타이포그래피

| 이름 | px | 사용처 |
|---|---|---|
| display | 34 | 온보딩 대형 제목 |
| xxxl | 28 | — |
| xxl | 24 | 아바타 이니셜 |
| xl | 20 | 섹션 헤더 |
| lg | 17 | 화면 제목, 카드 제목 |
| md | 15 | 본문, 버튼 레이블, 입력 필드 |
| sm | 13 | 설명, 레이블, 날짜 |
| xs | 11 | 배지, 태그, 캡션 |

폰트 두께: regular(400) · medium(500) · semibold(600) · bold(700)

---

## 간격 시스템

| 이름 | px | 주요 사용처 |
|---|---|---|
| xs | 4 | 인라인 요소 간격 |
| sm | 8 | 아이콘↔텍스트, 칩 간격 |
| md | 12 | 폼 요소 내부 패딩 |
| lg | 16 | 화면 좌우 여백, 섹션 간격 |
| xl | 20 | 섹션 상단 여백 |
| xxl | 24 | 카드 간격 |
| xxxl | 32 | 폼 그룹 간격 |
| xxxxl | 40 | 스크롤 하단 여백 |

**borderRadius**: sm(8) · md(12) · lg(16) · xl(20) · full(9999)

---

## 화면 목록 (구현 완료 — Figma 디자인 요청 우선순위 순)

| # | 화면 | 라우트 | 비고 |
|---|---|---|---|
| 1 | 스플래시 스크린 | — | 배경색 `#E8F8F3`, 로고 아이콘 |
| 2 | 온보딩 | — | 선택 사항 |
| 3 | 로그인 | `/(auth)/login` | Google·Apple 버튼, 발자국 로고 |
| 4 | 캘린더 메인 | `/(tabs)/` | 반려동물 선택 탭, 월간 캘린더, 썸네일 |
| 5 | 건강 다이어리 작성/상세 | `/(tabs)/index` 내 | 다이어리 에디터, 사진 첨부 |
| 6 | 진료기록 목록 | `/(tabs)/records` | 타임라인, OCR 버튼 |
| 7 | 진료기록 상세 | `/records/[id]` | 첨부파일 그리드, 수정/삭제 |
| 8 | 진료기록 작성/수정 | `/records/create` | OCR 프리필 지원 |
| 9 | OCR 결과 확인 | `/records/create?ocr=...` | 진료기록 작성과 동일 화면 |
| 10 | 수치 트래킹 그래프 | `/(tabs)/index` 내 | 꺾은선 그래프, 타입 선택 |
| 11 | 예방접종 목록 | — | D-day 배지, 알림 스위치 |
| 12 | 먹이/알러지 정보 | — | 칩 입력 (알러지=빨강, 금지=노랑) |
| 13 | 응급병원 찾기 | — | 지도/리스트, 전화 버튼 |
| 14 | 커뮤니티 목록 | `/(tabs)/community` | 태그 필터, 검색, 무한 스크롤, FAB |
| 15 | 게시글 상세+댓글 | `/posts/[id]` | 좋아요(빨간 하트), 댓글 목록 |
| 16 | 마이페이지 | `/(tabs)/mypage` | 프로필, 반려동물 가로 스크롤, 구독 배지 |
| 17 | 프리미엄 모달 | 전역 (PremiumModal) | 402 응답 시 자동 표시, 구매 CTA |
| 18 | 반려동물 등록/수정 | `/pets/new` | 종류·성별 pill 선택, 중성화 스위치 |

---

## 컴포넌트 현황

### 공통 컴포넌트 (`frontend/shared/components/`)
- `Button` — primary/secondary/ghost 변형
- `Card` — 기본 카드 래퍼
- `PremiumModal` — 프리미엄 업그레이드 안내 모달
- `EmptyState` — 데이터 없을 때 일러스트+텍스트
- `LoadingSpinner` — 로딩 인디케이터

### 아이콘 라이브러리
`@expo/vector-icons` Feather 아이콘 사용

---

## 앱 기본 정보

| 항목 | 값 |
|---|---|
| 앱 이름 | 발자국 |
| Bundle ID (iOS) | com.arrivallab.pawprint |
| Package (Android) | com.arrivallab.pawprint |
| 스플래시 배경 | `#E8F8F3` |
| 방향 | portrait (세로 고정) |
| 탭 구성 | 다이어리 / 진료기록 / 커뮤니티 / 마이페이지 |
