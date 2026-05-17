import { useEffect, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { useRecords } from '../../record/hooks/useRecords';
import { useMetrics } from '../../metric/hooks/useMetrics';
import { useRecentDiaries } from '../../diary/hooks/useRecentDiaries';
import { useCareItems } from '../../care/hooks/useCare';

const storage = createMMKV({ id: 'pawprint-onboarding' });
const DISMISSED_KEY = 'onboarding-dismissed';

export type OnboardingStep = 'record' | 'diary' | 'weight' | 'care' | null;

const STEP_META: Record<Exclude<OnboardingStep, null>, {
  title: string;
  body: string;
  cta: string;
  route: string;
}> = {
  record: {
    title: '첫 진료기록을 추가해보세요',
    body: '병원 방문 내역을 기록해두면 다음 진료에 큰 도움이 돼요',
    cta: '진료기록 추가',
    route: '/(tabs)/records?tab=records',
  },
  diary: {
    title: '오늘 하루를 다이어리에 남겨보세요',
    body: '컨디션·식사·산책을 가볍게 기록하면 작은 변화도 놓치지 않아요',
    cta: '다이어리 작성',
    route: '/(tabs)/diary',
  },
  weight: {
    title: '체중 기록을 시작해보세요',
    body: '꾸준히 측정하면 변화 추이가 한눈에 보여요',
    cta: '수치 기록',
    route: '/(tabs)/records?tab=metrics',
  },
  care: {
    title: '매일 챙길 케어를 설정해보세요',
    body: '사료·간식·영양제 같은 일상 케어를 체크리스트로 관리해요',
    cta: '케어 시작',
    route: '/(tabs)/records?tab=daily',
  },
};

export function getStepMeta(step: Exclude<OnboardingStep, null>) {
  return STEP_META[step];
}

function isDismissed(): boolean {
  return storage.getBoolean(DISMISSED_KEY) ?? false;
}

export function useOnboardingDismiss() {
  const [dismissed, setDismissed] = useState(isDismissed);
  const dismiss = () => {
    storage.set(DISMISSED_KEY, true);
    setDismissed(true);
  };
  return { dismissed, dismiss };
}

/**
 * 첫 펫 기준 — 진료기록·다이어리·체중·케어 항목 순서대로 미완료 단계 반환.
 * 모두 완료 또는 사용자 dismiss 시 null.
 */
export function useOnboardingStep(petId: number | null | undefined): OnboardingStep {
  const enabled = !!petId;
  const { data: recordsPage } = useRecords(petId ?? 0);
  const { data: weightPage } = useMetrics(petId ?? 0, 'WEIGHT');
  const { data: diaries } = useRecentDiaries(petId ?? null, { limit: 1 });
  const { data: careItems } = useCareItems(petId ?? 0);

  if (!enabled) return null;

  const hasRecord = (recordsPage?.pages.flatMap((p: any) => p.content) ?? []).length > 0;
  const hasWeight = (weightPage?.pages.flatMap((p: any) => p.content) ?? []).length > 0;
  const hasDiary = diaries.length > 0;
  const hasCare = (careItems ?? []).length > 0;

  if (!hasRecord) return 'record';
  if (!hasDiary) return 'diary';
  if (!hasWeight) return 'weight';
  if (!hasCare) return 'care';
  return null;
}
