import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationPreferencesApi,
  type NotificationPreferences,
  type NotificationPreferencesPatch,
} from '../api/notificationPreferencesApi';

const QUERY_KEY = ['notification-preferences'] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => notificationPreferencesApi.get(),
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) => notificationPreferencesApi.patch(patch),
    // optimistic — 토글 즉시 반영. 실패하면 invalidate 로 서버 값 재로드.
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const previous = qc.getQueryData<NotificationPreferences>(QUERY_KEY);
      if (previous) {
        qc.setQueryData<NotificationPreferences>(QUERY_KEY, { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(QUERY_KEY, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
