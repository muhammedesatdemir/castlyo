'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, Menu, X, Star } from 'lucide-react'

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
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="logo nav-link text-xl font-bold text-[#F6E6C3] hover:text-white transition-colors duration-200">
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

            {/* Hamburger Menu Dropdown */}
            <div ref={menuRef} className={`auth-menu ${isMobileMenuOpen ? 'open' : ''}`}>
              {/* Navigation Links */}
              <div className="nav-section">
                <Link 
                  href="#explore" 
                  className="nav-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Keşfet
                </Link>
                <Link 
                  href="/jobs" 
                  className="nav-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  İlanlar
                </Link>
                <Link 
                  href="#features" 
                  className="nav-item"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Özellikler
                </Link>
              </div>
              
              {/* Auth Buttons */}
              <div className="auth-section">
                <button
                  onClick={() => {
                    onSignup("talent")
                    setIsMobileMenuOpen(false)
                  }}
                  className="primary"
                >
                  Kayıt Ol
                </button>
                <button
                  onClick={() => {
                    onSignup("agency")
                    setIsMobileMenuOpen(false)
                  }}
                  className="ghost"
                >
                  Giriş Yap
                </button>
              </div>
            </div>
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
                className="nav-link text-[#F6E6C3] hover:text-white transition-colors duration-200 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Keşfet
              </Link>
              <Link 
                href="/jobs" 
                className="nav-link text-[#F6E6C3] hover:text-white transition-colors duration-200 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                İlanlar
              </Link>
              <Link 
                href="#features" 
                className="nav-link text-[#F6E6C3] hover:text-white transition-colors duration-200 py-2"
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
                      className="w-full rounded-lg bg-[#F6E6C3] hover:bg-white text-black font-semibold px-4 py-2 transition-all duration-200"
                    >
                      Kayıt Ol
                    </button>
                    <button 
                      onClick={() => {
                        onSignup("agency")
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full rounded-lg border border-[#F6E6C3] text-[#F6E6C3] hover:bg-gray-800 hover:text-white px-4 py-2 transition-all duration-200"
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
