import { createMMKV } from 'react-native-mmkv';

// 리뷰 프롬프트 게이팅 전용 저장소 — 토큰/일반 상태와 분리(widgetStorage 패턴과 동일).
const storage = createMMKV({ id: 'pawprint-review' });

const KEYS = {
  /** 마지막 프롬프트 이후 쌓인 "긍정 모먼트"(진료기록 작성 등) 누적 횟수. */
  POSITIVE_COUNT: 'positive_count',
  /** 마지막으로 네이티브 리뷰 프롬프트를 띄운 시각 (epoch ms). */
  LAST_PROMPT_AT: 'last_prompt_at',
  /** 앱 생애 동안 프롬프트를 띄운 총 횟수 — OS 빈도 제한과 별개의 자체 상한. */
  PROMPT_COUNT: 'prompt_count',
} as const;

export const getPositiveCount = (): number => storage.getNumber(KEYS.POSITIVE_COUNT) ?? 0;
export const incPositiveCount = (): number => {
  const n = getPositiveCount() + 1;
  storage.set(KEYS.POSITIVE_COUNT, n);
  return n;
};
export const resetPositiveCount = (): void => storage.set(KEYS.POSITIVE_COUNT, 0);

export const getLastPromptAt = (): number => storage.getNumber(KEYS.LAST_PROMPT_AT) ?? 0;
export const setLastPromptAt = (ms: number): void => storage.set(KEYS.LAST_PROMPT_AT, ms);

export const getPromptCount = (): number => storage.getNumber(KEYS.PROMPT_COUNT) ?? 0;
export const incPromptCount = (): void => storage.set(KEYS.PROMPT_COUNT, getPromptCount() + 1);
