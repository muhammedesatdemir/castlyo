'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { User, Menu, X } from 'lucide-react'
import { montserratDisplay } from '@/lib/fonts'

interface HeaderProps {
  onSignup: (type: "talent" | "agency") => void
}

export default function Header({ onSignup }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn] = useState(false) // TODO: Replace with actual auth state
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current && 
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isMobileMenuOpen])

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
                  tracking-[0.10em] md:tracking-[0.12em]
                  drop-shadow-[0_0_6px_rgba(246,230,195,0.38)]
                  hover:text-white transition-colors duration-200
                "
              >
                Castlyo
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - REMOVED: Moved to hamburger menu */}

          {/* Desktop Hamburger Menu */}
          <div className="hidden md:flex items-center space-x-4 relative">
            <button
              ref={buttonRef}
              className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Kullanıcı menüsü"
            >
              <span className="line"></span>
              <span className="line"></span>
              <span className="line"></span>
            </button>

            {/* Compact Hamburger Menu Dropdown */}
            {isMobileMenuOpen && (
              <div 
                ref={menuRef}
                className="
                  absolute right-4 top-12 z-50
                  w-56 rounded-lg bg-black/95 ring-1 ring-white/10 shadow-lg
                "
                role="menu"
                aria-label="Ana menü"
              >
                {/* Compact navigation */}
                <nav className="py-3">
                  <ul className="px-2 space-y-1 text-sm leading-5">
                    <li>
                      <Link 
                        href="#explore" 
                        className="block rounded-md px-2.5 py-2 text-[#F6E6C3] hover:bg-white/5"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Keşfet
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="/jobs" 
                        className="block rounded-md px-2.5 py-2 text-[#F6E6C3] hover:bg-white/5"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        İlanlar
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="#features" 
                        className="block rounded-md px-2.5 py-2 text-[#F6E6C3] hover:bg-white/5"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Özellikler
                      </Link>
                    </li>

                    {/* Subtle divider */}
                    <li className="my-1 border-t border-white/10" />

                    <li>
                      <button
                        onClick={() => {
                          onSignup("talent")
                          setIsMobileMenuOpen(false)
                        }}
                        className="
                          block w-full text-left whitespace-nowrap
                          rounded-md px-2.5 py-2 font-semibold
                          bg-[#F6E6C3] text-[#1b1b1b]
                          hover:opacity-90
                        "
                      >
                        Yetenek Olarak Başla
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          onSignup("agency")
                          setIsMobileMenuOpen(false)
                        }}
                        className="
                          block w-full text-left whitespace-nowrap
                          rounded-md px-2.5 py-2
                          text-[#F6E6C3] hover:bg-white/5
                        "
                      >
                        Ajans Olarak Başla
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          window.location.href = '/auth'
                          setIsMobileMenuOpen(false)
                        }}
                        className="block w-full text-left rounded-md px-2.5 py-2 text-[#F6E6C3] hover:bg-white/5"
                      >
                        Giriş Yap
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hamburger nav-link inline-flex items-center justify-center w-10 h-10 bg-transparent border border-[#F6E6C3] rounded-lg text-[#F6E6C3] hover:text-white hover:border-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="#explore" 
                className={montserratDisplay.className + " nav-link text-[#F6E6C3] hover:text-white transition-colors duration-200 py-2 font-medium tracking-normal"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Keşfet
              </Link>
              <Link 
                href="/jobs" 
                className={montserratDisplay.className + " nav-link text-[#F6E6C3] hover:text-white transition-colors duration-200 py-2 font-medium tracking-normal"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                İlanlar
              </Link>
              <Link 
                href="#features" 
                className={montserratDisplay.className + " nav-link text-[#F6E6C3] hover:text-white transition-colors duration-200 py-2 font-medium tracking-normal"}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Özellikler
              </Link>
              
              <div className="pt-4 border-t border-gray-800">
                {isLoggedIn ? (
                  <Button variant="outline" size="sm" className="w-full rounded-lg">
                    <User className="w-4 h-4 mr-2" />
                    Profilim
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => {
                        onSignup("talent")
                        setIsMobileMenuOpen(false)
                      }}
                      className={montserratDisplay.className + " w-full rounded-lg bg-[#F6E6C3] hover:bg-white text-black font-bold px-4 py-2 transition-all duration-200 tracking-wide"}
                    >
                      Yetenek Olarak Başla
                    </button>
                    <button 
                      onClick={() => {
                        onSignup("agency")
                        setIsMobileMenuOpen(false)
                      }}
                      className={montserratDisplay.className + " w-full rounded-lg bg-[#962901] hover:bg-[#7a2000] text-white font-bold px-4 py-2 transition-all duration-200 tracking-wide"}
                    >
                      Ajans Olarak Başla
                    </button>
                    <button 
                      onClick={() => {
                        window.location.href = '/auth'
                        setIsMobileMenuOpen(false)
                      }}
                      className={montserratDisplay.className + " w-full rounded-lg border border-[#F6E6C3] text-[#F6E6C3] hover:bg-gray-800 hover:text-white px-4 py-2 transition-all duration-200 font-medium tracking-normal"}
                    >
                      Giriş Yap
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
