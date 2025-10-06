"use client"

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { clearClientAuth } from '@/lib/api'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import RoleGateCTA from '@/components/shared/RoleGateCTA'
import { useMe } from '@/hooks/useMe'
import { MENU } from '@/constants/menu'

interface HeaderProps {
  onSignup: (type: "talent" | "agency") => void
}

export default function Header({ onSignup }: HeaderProps) {
  const { data: session, status } = useSession()
  const { data: me } = useMe()
  const isLoggedIn = status === 'authenticated'
  const isTalent = me?.role === "TALENT"
  const [open, setOpen] = useState(false)
  
  // Filter menu items based on authentication status and role
  const visibleMenuItems = MENU.filter(item => {
    if (!('requiresAuth' in item) || !isLoggedIn) {
      return !('requiresAuth' in item) || isLoggedIn
    }
    
    // Special case for "Profilim" - only show for TALENT users
    if (item.label === 'Profilim') {
      return isLoggedIn && isTalent
    }
    
    return isLoggedIn
  })

  return (
    <header className="site-header fixed top-0 w-full z-50 bg-black border-b border-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span
                className="
                  font-brand uppercase
                  text-[#F6E6C3]
                  text-2xl md:text-3xl
                  font-extrabold
                  tracking-[0.08em]
                  drop-shadow-[0_0_8px_rgba(246,230,195,0.55)]
                  hover:text-white transition-colors duration-200
                "
              >
                Castlyo
              </span>
            </Link>
          </div>

          {/* Hamburger Button (mobil + masaüstü) */}
          <button
            aria-label="Menüyü Aç/Kapat"
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center justify-center rounded-md p-2 text-[#F6E6C3] hover:bg-white/5 transition-colors"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Açılır Menü */}
        <nav
          className={`$${''} ${open ? 'block' : 'hidden'} absolute right-6 top-16 md:right-8 md:top-16 bg-black text-white shadow-xl border border-gray-800 rounded-lg p-4 space-y-3 w-64`}
        >
          {visibleMenuItems.map((item) => {
            if ('role' in item && item.role) {
              // Role-based items (Yetenek/Ajans)
              return (
                <div key={item.href} onClick={() => setOpen(false)}>
                  <RoleGateCTA 
                    targetRole={item.role} 
                    to={item.href} 
                    className="w-full justify-start text-left hover:text-[#F6E6C3] bg-transparent border-none text-left p-0"
                  >
                    {item.label}
                  </RoleGateCTA>
                </div>
              )
            } else {
              // Regular navigation items
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setOpen(false)} 
                  className="block hover:text-[#F6E6C3]"
                >
                  {item.label}
                </Link>
              )
            }
          })}

          <button
            onClick={() => {
              if (isLoggedIn) {
                try { clearClientAuth() } catch {}
                signOut()
              } else {
                signIn()
              }
            }}
            className="w-full px-4 py-2 bg-[#F6E6C3] text-[#1b1b1b] rounded-md font-semibold hover:opacity-90"
          >
            {isLoggedIn ? 'Çıkış Yap' : 'Giriş Yap'}
          </button>
        </nav>
      </div>
    </header>
  )
}
