'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { __SESSION_KILLED__ } from '@/lib/api'

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error: any) => {
          const status = error?.status ?? error?.response?.status
          if (__SESSION_KILLED__) return false
          if (status === 401) return false
          if (status === 404 && (error?.url?.endsWith?.('/users/me') || error?.config?.url?.endsWith?.('/users/me'))) return false
          return failureCount < 2
        },
      },
    },
  }))
  
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
