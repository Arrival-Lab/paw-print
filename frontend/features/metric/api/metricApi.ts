import client from '../../../shared/api/client';
import i18n from '../../../shared/i18n';
import type { PageResponse } from '../../../shared/api/types';

export type MetricType =
  | 'WEIGHT'
  | 'BUN'
  | 'CREATININE'
  | 'WATER_INTAKE'
  | 'FOOD_INTAKE'
  | 'BOWEL_COUNT'
  | 'URINE_COUNT'
  | 'VOMIT_COUNT'
  | 'CUSTOM';

// 타입별 기본 단위. 사용자는 직접 입력으로 덮어쓸 수 있음.
// 단위는 DB 에 저장되고 차트 합산 로직(isSumUnit)의 토큰으로도 쓰이는 데이터값이라 비번역.
// 카운트 단위('회')는 표시 시 localizeUnit() 으로 현재 언어에 맞춰 변환한다.
export const METRIC_TYPE_UNIT: Record<MetricType, string> = {
  WEIGHT: 'kg',
  BUN: 'mg/dL',
  CREATININE: 'mg/dL',
  WATER_INTAKE: 'ml',
  FOOD_INTAKE: 'g',
  BOWEL_COUNT: '회',
  URINE_COUNT: '회',
  VOMIT_COUNT: '회',
  CUSTOM: '',
};

/** 저장된 단위 토큰을 표시용으로 현지화. '회' 만 언어별로 변환, 나머지(kg/ml/g/mg/dL)는 그대로. */
export function localizeUnit(unit: string | null | undefined): string {
  if (!unit) return '';
  if (unit === '회') return i18n.t('metric.unitCount');
  return unit;
}

/** 다이어리 빠른 입력용 칩 — 라벨은 i18n metric.quick.* 에서. */
export const DAILY_METRIC_QUICK: { type: MetricType; labelKey: string; defaultValue: number }[] = [
  { type: 'WATER_INTAKE', labelKey: 'metric.quick.water', defaultValue: 100 },
  { type: 'FOOD_INTAKE', labelKey: 'metric.quick.food', defaultValue: 50 },
  { type: 'BOWEL_COUNT', labelKey: 'metric.quick.bowel', defaultValue: 1 },
  { type: 'URINE_COUNT', labelKey: 'metric.quick.urine', defaultValue: 1 },
  { type: 'VOMIT_COUNT', labelKey: 'metric.quick.vomit', defaultValue: 1 },
];

export interface Metric {
  id: number;
  metricType: MetricType;
  metricName: string | null;
  value: number;
  unit: string | null;
  measuredAt: string;
}

export interface MetricPoint {
  measuredAt: string;
  value: number;
}

export interface MetricRequest {
  metricType: MetricType;
  metricName?: string;
  value: number;
  unit?: string;
  measuredAt: string;
}

export const metricApi = {
  create: (petId: number, data: MetricRequest) =>
    client.post<Metric>(`/api/pets/${petId}/metrics`, data),

  getMetrics: (petId: number, params?: { type?: MetricType; page?: number; size?: number }) =>
    client.get<PageResponse<Metric>>(`/api/pets/${petId}/metrics`, { params }),

  getChartData: (petId: number, type: MetricType, params?: { from?: string; to?: string }) =>
    client.get<MetricPoint[]>(`/api/pets/${petId}/metrics/chart`, { params: { type, ...params } }),

  delete: (petId: number, metricId: number) =>
    client.delete<void>(`/api/pets/${petId}/metrics/${metricId}`),
};
