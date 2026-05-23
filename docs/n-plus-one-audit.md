# JPA N+1 쿼리 일제 점검 & 해결

## 배경

발자국 백엔드는 Spring Boot 3.3 + Hibernate 6.5 + PostgreSQL 18 조합. 1인 풀스택 환경이라
초반엔 API 가 도는 데 집중했고, JPA 연관관계의 lazy loading 함정은 그동안 잡지 않았음.
2026-05-23 기준 도메인이 어느 정도 안정되어 트래픽이 많은 엔드포인트(홈, 진료기록 리스트,
다이어리 리스트, 커뮤니티 피드)부터 N+1 을 일제 점검 — 본 문서는 그 결과·결정·해결 패턴
정리.

## 증상

리스트 조회 엔드포인트마다 동일한 패턴:

- 페이지 N개 entity 조회 → DTO 변환 시 lazy 연관 (컬렉션 or @ManyToOne) 접근 → 추가 N개
  SELECT 가 도는 **N+1 폭발**.
- 트래픽이 높을수록 RDS db.t3.micro 의 connection pool 점유가 빠르게 늘어 latency 증가.
- prod 에서 `open-in-view: false` 로 설정되어 있어 controller 단까지 lazy 로딩이 새지 않는 건
  좋지만, service 안에서의 N+1 은 그대로 발생.

## 점검 범위

JPA `@OneToMany` / `@ManyToOne` / `@OneToOne` / `@ManyToMany` / `@ElementCollection` 을
가진 모든 엔티티 + 그 엔티티를 리스트로 받아 DTO 변환하는 모든 서비스 메서드.

도메인별 발견 결과:

| 도메인 | 위치 | lazy 필드 | 발생 시나리오 |
|---|---|---|---|
| 진료기록 | `MedicalRecordRepository.findByPetId` | `attachments` (OneToMany) | 진료기록 페이지 20개 → 21쿼리 |
| 진료기록 | `MedicalRecordRepository.findByUserId` | `attachments` (OneToMany) | "전체" 모드도 동일 |
| 다이어리 | `HealthDiaryRepository.findByPet_*` | `photos`, `tags` (둘 다 OneToMany) | 다이어리 10개 → 21쿼리 |
| 다이어리 | `HealthDiaryRepository.search` | `photos`, `tags` | 검색 결과 페이지 동일 |
| 다이어리 | `findForCalendar`, `findForUserCalendar`, `findMemoriesForUser` | `photos`, `tags` | 캘린더/메모리 빌드 시 |
| 커뮤니티 | `PostRepository.findAll` | `user` (ManyToOne) | 피드 페이지 20개 → 21쿼리 |
| 커뮤니티 | `CommentRepository.findVisibleByPostId` | `user` (ManyToOne) | 댓글 50개 → 51쿼리 |
| 케어 | `CareService.getAccessiblePets` | (N+1 아닌 메모리 비효율) `findAll()` 전체 로드 | share_members 누적되면 OOM 위험 |

### 의도적으로 둔 N+1 — 건드리지 않음

`backend/CLAUDE.md` 에 명시되어 있는 "N+1 허용" 사례 두 곳은 그대로 유지:

- **`AppointmentService.getAll/getMonth` 의 linkedRecordId lookup** — 펫당 예약 수가 보통
  5~10개라 추가 쿼리 비용 미미. JOIN 으로 풀어쓰면 쿼리 자체가 복잡해져 가독성 손해.
- **`PetService.getMyPets/getPet` 의 sharedMemberCount** — `countByPetIdAndStatus` 가 펫당
  1번 도는데, 펫 마릿수 자체가 무료 3마리 / 유료도 보통 한 자릿수.

→ 트래픽이 늘거나 펫 수가 늘면 재검토.

## 원인 정리

1. JPA 의 `@OneToMany` 는 기본 LAZY → 컬렉션 호출 시점에 SELECT 발생.
2. `@ManyToOne` 은 기본 EAGER 이지만 발자국 백엔드는 모든 ManyToOne 에 `fetch = LAZY`
   명시 → 마찬가지로 호출 시점에 SELECT.
3. Repository 쿼리에 JOIN FETCH / EntityGraph 가 없으면 DTO 변환 단계에서 N+1.
4. Hibernate 의 `default_batch_fetch_size` 미설정 → lazy 로딩이 묶이지 않고 1건씩 발사.

## 해결 전략 — 왜 "전부 JOIN FETCH" 가 아닌가

가장 단순한 해법은 모든 lazy 연관을 JOIN FETCH 로 명시하는 것이지만 두 가지 함정이 있다.

### 함정 1: 페이징 + `@OneToMany` JOIN FETCH = HHH000104 메모리 페이징

```
HHH000104: firstResult/maxResults specified with collection fetch;
           applying in memory
```

Hibernate 는 `Page<MedicalRecord>` + `JOIN FETCH r.attachments` 를 만나면 SQL `LIMIT/OFFSET`
을 못 붙인다 (1:N 으로 row 가 부풀어 정확한 페이징 불가). 대신 **전체 결과를 메모리에 로드**
한 뒤 거기서 페이징 — 데이터 누적되면 OOM 직행.

### 함정 2: 다중 컬렉션 JOIN FETCH = 카르테시안 곱

`HealthDiary` 처럼 `photos` + `tags` 둘 다 컬렉션인데 동시에 JOIN FETCH 하면 한 diary 의
row 수가 `photos.size * tags.size` 로 부풀음. `DISTINCT` 로 dedupe 는 되지만 네트워크 전송량은
이미 폭발한 뒤.

### 채택: 두 단계 전략

1. **`default_batch_fetch_size: 100` 안전망 추가** — lazy 컬렉션·프록시를 IN 절로 묶어서
   N+1 → `1 + ceil(N/100)` 으로 자동 완화. 페이지 사이즈가 보통 20인 발자국 환경에선
   사실상 컬렉션 한 번에 다 끌어옴.
2. **명시적 JOIN FETCH 는 `@ManyToOne` 에만 적용** — 페이징 안전하고 카르테시안 곱 없음.
   `Post.user`, `Comment.user` 에 추가.

이렇게 하면:
- `MedicalRecord.attachments`, `HealthDiary.photos`, `HealthDiary.tags` 등 **컬렉션은
  명시적 변경 없이 batch_fetch_size 만으로 해결** — repository 코드 변경 최소화.
- `@ManyToOne` 만 JOIN FETCH 추가 — countQuery 분리만 필요.
- 페이징 함정·카르테시안 곱 둘 다 회피.

## 변경 사항

### 1. `application.yml` — Hibernate batch fetch 설정

```yaml
spring:
  jpa:
    properties:
      hibernate:
        default_batch_fetch_size: 100
```

이 한 줄로 다음이 자동 해결:

- `MedicalRecord.attachments` — 진료기록 리스트 페이지에서 `attachmentCount` 계산.
- `HealthDiary.photos` / `HealthDiary.tags` — 다이어리 리스트·검색·캘린더·"N년 전 오늘".
- `MemoryDiaryDto.from` 의 `photos.size()`, `photos.get(0)` 접근.
- DiaryService.buildCalendar 의 `photos.isEmpty()`, `tags.stream()` 접근.

값을 100 으로 잡은 이유: 페이지 사이즈(보통 20) 보다 넉넉히 — 한 IN 절에 모두 묶이도록.
PostgreSQL 의 IN 절 파라미터 한계(32767)에 한참 못 미치니 안전.

### 2. `PostRepository.findAll` — `JOIN FETCH p.user` + countQuery 분리

```jpql
SELECT p FROM Post p JOIN FETCH p.user WHERE ...
```

- `PostSummaryDto.from` 이 `p.getUser().getNickname()`, `p.getUser().getProfileImage()` 를
  바로 읽기 때문.
- **`countQuery` 를 분리해야 함** — JOIN FETCH 와 COUNT 를 한 쿼리로 못 씀.
- 기존 boolean flag 기반 nullable 회피 패턴(`tagFilter`, `keywordFilter`)은 countQuery 에도
  그대로 복제.

### 3. `CommentRepository.findVisibleByPostId` — `JOIN FETCH c.user`

```jpql
SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId ...
```

- `CommentDto.from` 이 `c.getUser().getNickname()`, `c.getUser().getProfileImage()` 를 읽음.
- 페이징 없는 List 반환이라 함정 없음.

### 4. `ShareMemberRepository.findByMemberIdAndStatus` 신규 추가

```jpql
SELECT sm FROM ShareMember sm JOIN FETCH sm.pet
WHERE sm.member.id = :memberId AND sm.status = :status
```

- `CareService.getAccessiblePets` 가 기존엔 `shareMemberRepository.findAll()` 후 메모리에서
  `.filter()` 했음 — share_members 누적되면 OOM 위험.
- DB 쿼리로 필터링하고, 어차피 곧 `sm.getPet()` 접근하므로 pet 까지 JOIN FETCH.
- 이게 N+1 자체는 아니었지만(메모리 비효율), 결과적으로 lazy `sm.getMember()` 접근 시
  추가 N+1 까지 잠재. 한 번에 정리.

## 함정: PostgreSQL 파라미터 타입 추론 호환성 유지

`backend/CLAUDE.md` 의 "JPQL 작성 시 주의 — PostgreSQL 파라미터 타입 추론" 룰을 그대로
지킴. 위 변경에서 `findAll` 의 `:tag`, `:keywordPattern` 은 여전히 boolean 플래그
(`:tagFilter`, `:keywordFilter`) 로 분기되며, 호출부에서 placeholder 값
(`PostTag.SYMPTOM_SHARE`, `"%"`) 을 항상 채워 보냄 — `(:p IS NULL OR ...)` 안티패턴 회피.

## 함정: ShareMember 역방향 조인 못 함

CLAUDE.md 명시: Pet 엔티티에 ShareMember 역매핑이 없어서 `LEFT JOIN ShareMember sm ON sm.pet = p`
같은 비표준 조인은 Hibernate 6.5 가 ECS startup validation 에서 거부 → circuit breaker
롤백. 그래서 이번에도 ShareMember 쪽에서 시작하는 정방향 쿼리만 사용.

## 검증

```bash
cd backend && ./gradlew compileJava
# BUILD SUCCESSFUL
```

JPQL 의 의미적 검증은 Hibernate 가 startup metamodel validation 단계에서 수행. ECS prod
배포 시 마이그레이션 후 첫 health check 전에 SessionFactory 가 빌드되며, JPQL 문법 오류가
있으면 `IllegalArgumentException` 으로 startup 자체가 실패 — 자동 롤백.

실제 prod 효과 측정은 CloudWatch logs 의 SQL 카운트 / RDS Performance Insights 로 추후 확인
권장.

## 향후 검토 — 트래픽 늘면 다시 볼 곳

1. **AppointmentService.getAll/getMonth linkedRecordId** — 현재 N+1 허용. 펫당 예약이
   수십 개 단위로 늘면 `IN` 절 일괄 조회 + Map 으로 전환:
   ```java
   List<MedicalRecord> linked = recordRepository.findByPet_IdAndAppointmentIdIn(petId, ids);
   Map<Long, Long> appointmentToRecordId = ...;
   ```
2. **PetService sharedMemberCount** — 펫 수 자체에 한도가 있어 당분간 무방.
3. **`@BatchSize` 어노테이션 fine-tuning** — 도메인별로 batch size 를 다르게 잡고 싶을 때.
   현재는 글로벌 `default_batch_fetch_size: 100` 만으로 충분.
4. **JPA `@EntityGraph` 도입 검토** — `@Query` + `JOIN FETCH` 보다 동적이고 재사용성 좋음.
   하지만 페이징 + 컬렉션 함정은 동일하게 적용 — batch_fetch_size 와 병행해야 안전.

## 참고

- Vlad Mihalcea, "The best way to fix the Hibernate MultipleBagFetchException"
- Hibernate User Guide §5.1.13 (Batch fetching)
- 프로젝트 내 관련 문서: `backend/CLAUDE.md` — JPQL 작성 시 주의 / ShareMember 조인 패턴
