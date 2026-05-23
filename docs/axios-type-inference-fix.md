# axios 응답 타입 추론 이슈 트러블슈팅

## 증상

`frontend/shared/api/client.ts` 에서 axios 응답 인터셉터가 `ApiResponse<T>.data` 만 unwrap 해서 반환하는데, axios 의 타입 선언은 여전히 `Promise<AxiosResponse<T>>` 를 약속한다. 즉:

- **타입스크립트가 추론하는 타입**: `{ data: T, status, headers, ... }`
- **런타임에 실제로 들어오는 값**: `T` 자체

게다가 인터셉터가 `apiResponse.data as any` 로 반환했기 때문에 호출부에서 넘긴 제네릭(`<Appointment[]>` 등)이 전혀 흘러오지 않아 호출 결과가 사실상 `any` 또는 `AxiosResponse<T>` 로 잡혔다.

## 앱에 끼친 실제 영향

1. **타입 안전망 사실상 무효화** — 호출부 변수가 `any` 로 떨어져 필드 오타·이름 변경을 컴파일러가 잡지 못함. 런타임 빈 화면/`undefined` 접근으로 직행 가능.
2. **`as unknown as T` / `as any` 우회 캐스팅 누적** — 추론이 안 맞으니까 호출부마다 강제 캐스팅. 약 15곳에 흩어져 있었음.
3. **React Query 합쳐지면서 `useQuery({ queryFn: api.xxx }).data` 도 같이 `any` 전염** — 화면 컴포넌트 전체가 타입 보호 없이 굴러갔다.
4. **402 / 401 에러 객체 타입도 `any`** — 프리미엄 모달 메시지 키 오타·refresh 토큰 응답 구조 변경을 잡지 못함.

## 원인

axios 응답 인터셉터의 unwrap 패턴 자체는 흔하지만, axios 의 타입 시그니처는 인터셉터를 거친 후의 반환 타입을 자동으로 반영하지 않는다. axios `get/post/...` 메서드는 항상 `Promise<AxiosResponse<T>>` 를 리턴하는 것으로 선언되어 있다.

## 해결: typed facade

`frontend/shared/api/client.ts` 에서 내부적으로 axios 인스턴스(`axiosInstance`)는 그대로 두고(인터셉터 등록을 위해 필요), 외부로 export 하는 `client` 객체는 typed facade 로 감쌌다. 핵심은 axios 의 두 번째 제네릭 인자 `R` 을 `T` 로 명시 지정해 반환 타입을 `Promise<T>` 로 강제하는 것.

```ts
type ApiClient = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>;
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>;
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>;
};

const client: ApiClient = {
  get: <T,>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T, T>(url, config),
  post: <T,>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<T, T>(url, data, config),
  // ...
};
```

- 호출부 API (`client.get<Foo>(...)`) 시그니처는 그대로. 17개 API 파일·90+ 호출지점 코드 변경 불필요.
- 두 번째 generic `R = T` 가 핵심. `axiosInstance.get<T, T>(...)` 로 호출하면 반환 타입이 `Promise<AxiosResponse<T>>` 가 아니라 `Promise<T>` 가 된다.
- 인터셉터 내부 `client(originalRequest)` 재시도 호출은 facade 에 callable form 이 없으므로 `axiosInstance(originalRequest)` 로 변경.

### 함정: generic + contextual typing

화살표 함수 파라미터에 명시적 타입을 안 적으면 generic 메서드는 contextual typing 이 안 먹어서 `implicit any` 에러가 난다.

```ts
// ❌ 안 됨 — url, config 가 implicit any
get: <T,>(url, config) => axiosInstance.get<T, T>(url, config),

// ✅ 파라미터 타입 명시 필요
get: <T,>(url: string, config?: AxiosRequestConfig) => axiosInstance.get<T, T>(url, config),
```

## 호출부 정리 — 제거한 우회 캐스팅

facade 도입 후 typescript 가 호출부 타입을 제대로 추론하므로 이전에 박혔던 강제 캐스팅들은 전부 잘못된 좁은 타입을 강요하거나 불필요해졌다. 다음 위치들에서 캐스팅 제거:

| 파일 | 캐스팅 |
|---|---|
| `app/(tabs)/index.tsx:90` | `(appointments as unknown as Array<{ petId: number }>).slice(0, 3)` |
| `features/appointment/hooks/useAppointments.ts:23` | `(data as unknown as { appointmentAt: string }[] \| undefined) ?? []` |
| `features/appointment/components/AppointmentsTab.tsx:36` | `(appointmentsRaw as unknown as Appointment[] \| undefined) ?? []` |
| `features/appointment/components/AppointmentsTab.tsx:258` | `(petsRaw as unknown as Pet[] \| undefined) ?? []` |
| `features/appointment/components/AppointmentsTab.tsx:272` | `(q.data as unknown as Appointment[] \| undefined) ?? []` |
| `features/medical/components/MedicalTab.tsx:42` | `(appointmentsRaw as unknown as Appointment[] \| undefined) ?? []` |
| `features/medical/components/MedicalTab.tsx:186` | `(petsRaw as unknown as Pet[] \| undefined) ?? []` |
| `features/medical/components/MedicalTab.tsx:203` | `(q.data as unknown as Appointment[] \| undefined) ?? []` |
| `features/record/components/RecordCreateSheet.tsx:94` | `const ocr = ocrRaw as any; // axios unwrap pattern` |
| `features/record/components/RecordCreateSheet.tsx:104` | `(created as any)?.id` |
| `features/record/components/RecordCreateSheet.tsx:192` | `(usage as any)?.ocrThisMonth` |
| `features/record/hooks/useRecordsByMonth.ts:25` | `data as unknown as PageResponse<MedicalRecordSummary> \| undefined` |
| `features/home/components/PetGroupCard.tsx:49` | `(data ?? []) as unknown as Pet[]` |
| `features/pet/components/PetContextBadge.tsx:58` | `(pets as unknown as Pet[] \| undefined) ?? []` |
| `features/food/hooks/useFoodInfoMap.ts:29` | `q.data as unknown as { allergies?: string[]; forbiddenFoods?: string[] } \| null` |
| `features/vaccine/components/VaccinesTab.tsx:116` | `[...(vaccines as any[])]` |

모두 `data ?? []` / `q.data ?? []` / 그대로 사용 형태로 정리.

## 보존한 캐스팅

다음은 **axios 와 무관**한 사유의 캐스팅이라 그대로 둠:

- `as any` for `router.push({ pathname: '...' })` — expo-router typed routes 미사용 영역.
- `FormData.append('file', { uri, type, name } as any)` — RN FormData 의 file blob 시그니처 호환.
- `as any` for expo-notifications trigger / React internal ref 접근 등.

## 검증

`npx tsc --noEmit` 실행 결과 axios 추론 관련 신규 에러 0건. 남은 컴파일 에러 12건은 전부 본 작업 이전부터 존재하던 무관한 이슈(Button.style prop 누락, MetricType enum 누락 필드, expo-iap `requestSubscription` API 시그니처 변경, react-native-calendars `DayState` 타입 등) — 별도 처리 필요.

## 향후 가이드

`client.get<T>(...)` 결과는 `T` 자체다. 다음 패턴은 모두 금지:

```ts
// ❌
const res = await client.get<Foo>('/foo');
const data = res.data;             // undefined — 인터셉터가 이미 unwrap 함
const x = res as any;              // facade 가 typed 라 캐스팅 불필요
const y = res as unknown as Foo;   // 위와 같음

// ✅
const foo = await client.get<Foo>('/foo');
foo.someField;
```

신규 코드에서 `as unknown as` / `as any` 가 axios 호출 결과 근처에 등장하면 거의 100% 잘못된 우회. PR 리뷰 시 캐치.
