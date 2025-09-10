'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
  checkOnboardingCompleted?: boolean
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth',
  checkOnboardingCompleted = false
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (requireAuth && status === 'loading') {
      // Still loading, don't redirect yet
      return
    }

    if (requireAuth && status === 'unauthenticated') {
      // Not authenticated and auth is required
      router.push(redirectTo)
      return
    }

    // Check if onboarding is completed and redirect to profile
    if (checkOnboardingCompleted && session?.user && status === 'authenticated') {
      // TODO: Check user's onboarding status from API
      // For now, we'll assume onboarding is not completed
      // This would be replaced with actual API call
      const isOnboardingCompleted = false // This should come from user profile API
      
      if (isOnboardingCompleted) {
        router.push('/profile')
        return
      }
    }
  }, [status, requireAuth, redirectTo, router, checkOnboardingCompleted, session])

  // Show loading spinner while checking auth
  if (requireAuth && status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  // Don't render children if auth is required but user is not authenticated
  if (requireAuth && status === 'unauthenticated') {
    return null
  }

  return <>{children}</>
}
