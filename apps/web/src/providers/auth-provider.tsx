'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { cleanupOldRoleStorage } from '@/utils/cleanup-old-storage'

interface AuthProviderProps {
  children: ReactNode
}

function SessionSyncWrapper({ children }: { children: ReactNode }) {
  useSessionSync()
  
  // Clean up old storage keys once on app start
  useEffect(() => {
    cleanupOldRoleStorage();
  }, []);
  
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
