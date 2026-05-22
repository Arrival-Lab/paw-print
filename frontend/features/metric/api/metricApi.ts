import client from '../../../shared/api/client';
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

/** 타입별 기본 단위. 사용자는 직접 입력으로 덮어쓸 수 있음. */
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

/** 다이어리 빠른 입력용 칩 라벨 — 일상 트래킹 정식화 (A3). */
export const DAILY_METRIC_QUICK: { type: MetricType; label: string; defaultValue: number }[] = [
  { type: 'WATER_INTAKE', label: '물 100ml', defaultValue: 100 },
  { type: 'FOOD_INTAKE', label: '사료 50g', defaultValue: 50 },
  { type: 'BOWEL_COUNT', label: '변 1회', defaultValue: 1 },
  { type: 'URINE_COUNT', label: '소변 1회', defaultValue: 1 },
  { type: 'VOMIT_COUNT', label: '구토 1회', defaultValue: 1 },
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
