import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Pull-to-refresh helper — 지정한 React Query queryKey prefix 들을 모두 invalidate.
 *
 * 예: ['pets'], ['records', petId] 같이 화면이 의존하는 prefix 들을 넘기면,
 * 새로고침 시 한꺼번에 refetch.
 *
 * invalidateQueries 는 active query refetch 완료까지 await 하므로 한 query 가
 * 늦으면 spinner 가 계속 돔. 5초 timeout 으로 race — refetch 는 백그라운드에서
 * 계속 진행, UI 만 먼저 풀어줌.
 */
const REFRESH_TIMEOUT_MS = 5000;

export function useRefresh(queryKeys: readonly (readonly unknown[])[]) {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const refetches = Promise.all(
        queryKeys.map((key) => qc.invalidateQueries({ queryKey: key })),
      );
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, REFRESH_TIMEOUT_MS));
      await Promise.race([refetches, timeout]);
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
