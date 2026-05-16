import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Pull-to-refresh helper — 지정한 React Query queryKey prefix 들을 모두 invalidate.
 *
 * 예: ['pets'], ['records', petId] 같이 화면이 의존하는 prefix 들을 넘기면,
 * 새로고침 시 한꺼번에 refetch.
 */
export function useRefresh(queryKeys: readonly (readonly unknown[])[]) {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map((key) => qc.invalidateQueries({ queryKey: key })),
      );
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
