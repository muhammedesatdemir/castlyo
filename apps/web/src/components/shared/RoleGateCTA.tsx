'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import React from 'react'

type Role = 'TALENT' | 'AGENCY'
type Props = {
  targetRole: Role
  to: string
  className?: string
  children: React.ReactNode
}

export default function RoleGateCTA({ targetRole, to, className, children }: Props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const userRole = (session?.user as any)?.role as Role | undefined
  const isAuthed = status === 'authenticated' && !!userRole
  const isMismatch = isAuthed && userRole !== targetRole

  const onClickCapture = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMismatch) {
      e.preventDefault()
      e.stopPropagation()
      // ❌ toast yok — guard gösterecek
      return
    }
  }

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMismatch) return
    if (to) router.push(to)
  }

  return (
    <button
      type="button"
      onClickCapture={onClickCapture}
      onClick={onClick}
      aria-disabled={isMismatch}
      data-role-user={userRole ?? ''}
      data-role-target={targetRole}
      data-role-mismatch={isMismatch ? 'true' : 'false'}
      data-role-guard="1"
      className={clsx(
        'inline-flex items-center justify-center rounded-xl transition-colors',
        isMismatch && 'opacity-60',
        className
      )}
    >
      {children}
    </button>
  )
}
