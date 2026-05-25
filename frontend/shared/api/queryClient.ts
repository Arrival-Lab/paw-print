import { QueryClient } from '@tanstack/react-query';

// 단일 인스턴스 — _layout 의 QueryClientProvider 가 이걸 주입하고,
// 401 forced logout 같은 React 밖 경로에서도 같은 인스턴스를 clear() 할 수 있도록 export.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      retryDelay: 1000,
    },
  },
});
