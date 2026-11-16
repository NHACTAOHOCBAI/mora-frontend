import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onSessionReset } from '@/features/auth/session';
import React, { useState, useLayoutEffect } from 'react';

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 phút
          },
        },
      })
  );

  useLayoutEffect(() => onSessionReset(() => {
    void queryClient.cancelQueries();
    queryClient.clear();
  }), [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
