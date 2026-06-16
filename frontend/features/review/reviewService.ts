import * as StoreReview from 'expo-store-review';
import { Platform, Linking } from 'react-native';
import {
  incPositiveCount,
  resetPositiveCount,
  getLastPromptAt,
  setLastPromptAt,
  getPromptCount,
  incPromptCount,
} from './reviewStorage';

// 게이팅 상수 — 스팸성 노출을 막아 "기분 좋은 순간"에만 1번씩 뜨게 한다.
const ACTION_THRESHOLD = 3; // 마지막 노출 이후 긍정 모먼트가 이만큼 쌓여야 후보
const COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // 마지막 노출 후 최소 60일 간격
const MAX_PROMPTS = 4; // 앱 생애 자체 상한 (Apple 연 3회 등 OS 제한과 별개의 안전장치)

// 스토어 리뷰 작성 페이지 — 수동 "앱 평가하기" 진입점에서 사용. (식별자는 AppUpdateGate 와 동일)
const WRITE_REVIEW_URL: Record<'ios' | 'android', string> = {
  ios: 'https://apps.apple.com/app/id6762686771?action=write-review',
  android: 'https://play.google.com/store/apps/details?id=com.arrivallab.pawprint',
};

/**
 * 긍정 모먼트(진료기록 작성 완료 등) 발생 시 호출. 카운터를 올리고, 게이팅을 모두
 * 통과할 때만 OS 네이티브 인앱 리뷰 프롬프트를 요청한다.
 * - 누적 긍정 액션 ≥ ACTION_THRESHOLD
 * - 마지막 노출 후 COOLDOWN_MS 경과 (또는 첫 노출)
 * - 생애 노출 횟수 < MAX_PROMPTS
 * 실제 프롬프트 노출 여부는 최종적으로 OS가 결정(빈도 제한)하며, 어떤 실패도
 * 사용자 흐름에 영향을 주지 않게 조용히 무시한다. 호출부는 await 없이 fire-and-forget.
 */
export async function noteReviewWorthyMoment(): Promise<void> {
  try {
    const count = incPositiveCount();
    if (count < ACTION_THRESHOLD) return;
    if (getPromptCount() >= MAX_PROMPTS) return;

    const last = getLastPromptAt();
    if (last && Date.now() - last < COOLDOWN_MS) return;

    if (!(await StoreReview.isAvailableAsync())) return;

    await StoreReview.requestReview();
    setLastPromptAt(Date.now());
    incPromptCount();
    resetPositiveCount();
  } catch {
    /* 리뷰 프롬프트 실패는 무시 — 핵심 흐름에 영향 없음 */
  }
}

/**
 * 사용자가 더보기에서 직접 "앱 평가하기" 를 눌렀을 때. 네이티브 프롬프트는 노출이
 * 보장되지 않으므로(OS 빈도 제한) 스토어의 리뷰 작성 페이지를 바로 연다.
 */
export async function openStoreReview(): Promise<void> {
  const url = WRITE_REVIEW_URL[Platform.OS === 'ios' ? 'ios' : 'android'];
  try {
    await Linking.openURL(url);
  } catch {
    /* noop */
  }
}
