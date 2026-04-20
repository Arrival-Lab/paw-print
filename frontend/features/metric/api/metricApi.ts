import client from '../../../shared/api/client';
import type { PageResponse } from '../../../shared/api/types';

export type MetricType = 'WEIGHT' | 'BUN' | 'CREATININE' | 'CUSTOM';

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
