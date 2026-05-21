import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { metricApi, MetricRequest, MetricType } from '../api/metricApi';

export function useMetrics(petId: number, type?: MetricType) {
  return useInfiniteQuery({
    queryKey: ['metrics', petId, type],
    queryFn: ({ pageParam = 0 }) =>
      metricApi.getMetrics(petId, { type, page: pageParam, size: 20 }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !!petId,
  });
}

export function useMetricChart(petId: number, type: MetricType, from?: string, to?: string) {
  return useQuery({
    queryKey: ['metric-chart', petId, type, from, to],
    queryFn: () => metricApi.getChartData(petId, type, { from, to }),
    enabled: !!petId,
  });
}

export function useCreateMetric(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MetricRequest) => metricApi.create(petId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metrics', petId] });
      qc.invalidateQueries({ queryKey: ['metric-chart', petId] });
    },
  });
}

export function useDeleteMetric(petId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (metricId: number) => metricApi.delete(petId, metricId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['metrics', petId] });
      qc.invalidateQueries({ queryKey: ['metric-chart', petId] });
    },
  });
}
