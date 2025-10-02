'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import Header from '@/components/layout/Header'
import ExploreGrid from '@/components/sections/ExploreGrid'
import { useRouter } from 'next/navigation'
import { showRoleMismatchToast } from '@/lib/role-toast'
import { useSession } from 'next-auth/react'

export default function DiscoverPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleSignup = (type: "talent" | "agency") => {
    const userRole = (session?.user as any)?.role as "TALENT" | "AGENCY" | undefined
    const isAuthed = status === "authenticated" && !!userRole
    const targetRole = type === "talent" ? "TALENT" : "AGENCY"

    if (isAuthed && userRole !== targetRole) {
      showRoleMismatchToast(userRole!)
      return
    }

    router.push(`/onboarding/${type}`)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen bg-black">
        <Header onSignup={handleSignup} />
        <ExploreGrid />
      </main>
    </AuthGuard>
  )
}
