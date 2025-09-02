'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { User, Menu, X, Star } from 'lucide-react'

interface HeaderProps {
  onSignup: (type: "talent" | "agency") => void
}

export default function Header({ onSignup }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn] = useState(false) // TODO: Replace with actual auth state

  return (
    <header className="fixed top-0 w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Castlyo
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="#explore" 
              className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
            >
              Keşfet
            </Link>
            <Link 
              href="/jobs" 
              className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
            >
              İlanlar
            </Link>
            <Link 
              href="#features" 
              className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
            >
              Özellikler
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" className="rounded-lg">
                  <User className="w-4 h-4 mr-2" />
                  Profilim
                </Button>
              </div>
            ) : (
              <>
                <button
                  id="header-talent"
                  type="button"
                  onClick={() => onSignup("talent")}
                  className="rounded-lg hover:bg-brand-50 hover:border-brand-300 hover:text-brand-primary transition-all px-4 py-2 border border-gray-300 text-sm font-medium"
                >
                  Yetenek
                </button>
                <button
                  id="header-agency"
                  type="button"
                  onClick={() => onSignup("agency")}
                  className="rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-105 transition-all duration-300 text-white shadow-lg px-4 py-2 text-sm font-medium"
                >
                  Ajans
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <nav className="flex flex-col space-y-3">
              <Link 
                href="#explore" 
                className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Keşfet
              </Link>
              <Link 
                href="/jobs" 
                className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                İlanlar
              </Link>
              <Link 
                href="#features" 
                className="text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Özellikler
              </Link>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                {isLoggedIn ? (
                  <Button variant="outline" size="sm" className="w-full rounded-lg">
                    <User className="w-4 h-4 mr-2" />
                    Profilim
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        onSignup("talent")
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full rounded-lg"
                    >
                      Yetenek Olarak Katıl
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        onSignup("agency")
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full rounded-lg bg-gradient-to-r from-brand-primary to-brand-secondary text-white"
                    >
                      Ajans Olarak Katıl
                    </Button>
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
