'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { useSessionSync } from '@/hooks/useSessionSync'

interface AuthProviderProps {
  children: ReactNode
}

function SessionSyncWrapper({ children }: { children: ReactNode }) {
  useSessionSync()
  return <>{children}</>
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <SessionSyncWrapper>
        {children}
      </SessionSyncWrapper>
    </SessionProvider>
  )
}
