'use client'
import { useRouter } from 'next/navigation'
import { useMe } from '@/hooks/useMe'
import { toast } from '@/components/ui/toast'
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
  const { data: me } = useMe()
  const userRole = me?.role
  const isMismatch = !!userRole && userRole !== targetRole

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMismatch) {
      e.preventDefault()
      e.stopPropagation()
      
      const message = userRole === 'TALENT'
        ? 'Yetenek hesabıyla Ajans onboardingine erişemezsiniz.'
        : 'Ajans hesabıyla Yetenek onboardingine erişemezsiniz.'
      
      toast.error('Erişim engellendi', message, 5000, 'role-mismatch')
      return
    }
    
    if (to) router.push(to)
  }

  return (
    <button
      type="button"
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
