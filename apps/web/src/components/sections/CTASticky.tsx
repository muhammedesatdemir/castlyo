'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function CTASticky() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const shouldShow = scrollY > 600
      setShow(shouldShow)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit"
        >
          <div className="rounded-2xl bg-white/90 px-6 py-3 shadow-2xl backdrop-blur-lg dark:bg-gray-900/90 border border-white/20">
            <div className="flex items-center gap-4">
              <Link 
                href="#signup-talent" 
                className="rounded-xl bg-brand-gradient-smooth px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-all duration-300"
              >
                Hemen Başla
              </Link>
              <Link 
                href="#signup-agency" 
                className="rounded-xl border border-gray-200 bg-white/50 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/80 transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-gray-800/80"
              >
                Ajanslar
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
