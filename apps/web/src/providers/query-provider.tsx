'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on 401 errors
          if (error instanceof Error && error.message === 'Unauthorized') {
            return false;
          }
          return failureCount < 3;
        },
      },
    },
  }))
  
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
