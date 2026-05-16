import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { metricApi } from '../../metric/api/metricApi';
import { recordApi } from '../../record/api/recordApi';
import { vaccineApi } from '../../vaccine/api/vaccineApi';
import { usePets } from '../../pet/hooks/usePets';

export interface PetInsight {
  petId: number;
  petName: string;
  /** "체중 +200g (지난번 대비)", "예방접종 D-3 임박", "마지막 진료 32일 전" 같은 한 줄. */
  text: string;
  /** error/warning/info — UI 톤 결정 */
  tone: 'error' | 'warning' | 'info';
}

function daysBetween(iso: string, to: Date = new Date()): number {
  const f = new Date(iso);
  return Math.floor((to.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * petId 지정 시 그 펫만, null 이면 모든 펫의 인사이트.
 * 각 펫당 최대 1개 (가장 시급/유의미한 것).
 */
export function usePetInsights(petId: number | null) {
  const { data: pets } = usePets();
  const targetPets = useMemo(
    () => (petId == null ? pets ?? [] : (pets ?? []).filter((p) => p.id === petId)),
    [pets, petId],
  );

  const weightQueries = useQueries({
    queries: targetPets.map((p) => ({
      queryKey: ['metric-chart', p.id, 'WEIGHT'],
      queryFn: () => metricApi.getChartData(p.id, 'WEIGHT'),
      staleTime: 5 * 60_000,
    })),
  });

  const recordQueries = useQueries({
    queries: targetPets.map((p) => ({
      queryKey: ['records', p.id, 'recent-1'],
      queryFn: () => recordApi.getRecords(p.id, { size: 1 }),
      staleTime: 5 * 60_000,
    })),
  });

  const vaccineQueries = useQueries({
    queries: targetPets.map((p) => ({
      queryKey: ['vaccines', p.id],
      queryFn: () => vaccineApi.getVaccines(p.id),
      staleTime: 5 * 60_000,
    })),
  });

  return useMemo<PetInsight[]>(() => {
    return targetPets
      .map((pet, idx): PetInsight | null => {
        const weights = (weightQueries[idx]?.data ?? []).slice().sort((a, b) =>
          a.measuredAt.localeCompare(b.measuredAt),
        );
        const lastRecord = recordQueries[idx]?.data?.content?.[0];
        const vaccines = vaccineQueries[idx]?.data ?? [];

        // 우선순위 1 — 임박 예방접종 (7일 이내)
        const urgentVaccine = vaccines
          .filter((v) => v.dDay !== null && v.dDay >= 0 && v.dDay <= 14)
          .sort((a, b) => (a.dDay ?? 999) - (b.dDay ?? 999))[0];
        if (urgentVaccine) {
          const dday = urgentVaccine.dDay ?? 0;
          return {
            petId: pet.id,
            petName: pet.name,
            text:
              dday === 0
                ? `${urgentVaccine.vaccineName} 오늘이 접종일이에요`
                : `${urgentVaccine.vaccineName} D-${dday} 임박`,
            tone: dday <= 3 ? 'error' : 'warning',
          };
        }

        // 우선순위 2 — 체중 변동 (전 측정 대비 ±5% 이상)
        if (weights.length >= 2) {
          const latest = weights[weights.length - 1];
          const prev = weights[weights.length - 2];
          const delta = latest.value - prev.value;
          const ratio = Math.abs(delta) / prev.value;
          if (ratio >= 0.05) {
            const sign = delta > 0 ? '+' : '−';
            return {
              petId: pet.id,
              petName: pet.name,
              text: `체중 ${sign}${Math.abs(delta).toFixed(1)} (지난번 대비 ${(ratio * 100).toFixed(0)}%)`,
              tone: 'warning',
            };
          }
        }

        // 우선순위 3 — 마지막 진료 60일 초과 (정기검진 시점)
        if (lastRecord?.visitedAt) {
          const days = daysBetween(lastRecord.visitedAt);
          if (days >= 60) {
            return {
              petId: pet.id,
              petName: pet.name,
              text: `마지막 진료 ${days}일 전 — 정기검진 시점이에요`,
              tone: 'info',
            };
          }
        }

        // 우선순위 4 — 진료 이력 없음 (펫 등록만 한 상태)
        if (!lastRecord) {
          return {
            petId: pet.id,
            petName: pet.name,
            text: '아직 진료기록이 없어요',
            tone: 'info',
          };
        }

        return null;
      })
      .filter((x): x is PetInsight => x !== null);
  }, [targetPets, weightQueries, recordQueries, vaccineQueries]);
}
