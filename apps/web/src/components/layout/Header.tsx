"use client"

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  onSignup: (type: "talent" | "agency") => void
}

export default function Header({ onSignup }: HeaderProps) {
  const { data: session, status } = useSession()
  const isLoggedIn = status === 'authenticated'
  const [open, setOpen] = useState(false)

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
          <Link href="/#discover" onClick={() => setOpen(false)} className="block hover:text-[#F6E6C3]">Keşfet</Link>
          <Link href="/jobs" onClick={() => setOpen(false)} className="block hover:text-[#F6E6C3]">İlanlar</Link>
          <Link href="/#features" onClick={() => setOpen(false)} className="block hover:text-[#F6E6C3]">Özellikler</Link>
          <Link href="/onboarding/talent" onClick={() => setOpen(false)} className="block hover:text-[#F6E6C3]">Yetenek Olarak Başla</Link>
          <Link href="/onboarding/agency" onClick={() => setOpen(false)} className="block hover:text-[#F6E6C3]">Ajans Olarak Başla</Link>
          <Link href="/profile" onClick={() => setOpen(false)} className="block hover:text-[#F6E6C3]">Profilim</Link>

          <button
            onClick={() => (isLoggedIn ? signOut() : signIn())}
            className="w-full px-4 py-2 bg-[#F6E6C3] text-[#1b1b1b] rounded-md font-semibold hover:opacity-90"
          >
            {isLoggedIn ? 'Çıkış Yap' : 'Giriş Yap'}
          </button>
        </nav>
      </div>
    </header>
  )
}
