import { useQuery } from '@tanstack/react-query';
import client from '../../../shared/api/client';

export interface UsageResponse {
  ocrThisMonth: number;
  yearMonth: string;
}

const usageApi = {
  getCurrent: () => client.get<UsageResponse>('/api/usage'),
};

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: () => usageApi.getCurrent(),
    staleTime: 30_000,
  });
}
