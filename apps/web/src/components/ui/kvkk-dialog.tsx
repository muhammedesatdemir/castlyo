'use client'

import { useEffect } from 'react'
import { Button } from './button'
import { X, FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react'

interface KvkkDialogProps {
  open: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  message?: string
  variant?: 'default' | 'success' | 'error'
}

export function KvkkDialog({ 
  open, 
  onClose, 
  onConfirm,
  title = "KVKK ve Kullanım Şartları",
  message = "Devam etmek için KVKK Aydınlatma Metni ve Kullanım Şartlarını kabul etmeniz gerekmektedir.",
  variant = 'default'
}: KvkkDialogProps) {
  
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (open) {
      document.addEventListener('keydown', onKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  // Variant-based styling
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-400" />,
          headerBg: 'from-green-600/90 to-green-500/90',
          borderColor: 'border-green-400/20'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-400" />,
          headerBg: 'from-red-600/90 to-red-500/90',
          borderColor: 'border-red-400/20'
        }
      default:
        return {
          icon: <Shield className="h-6 w-6 text-blue-400" />,
          headerBg: 'from-blue-600/90 to-blue-500/90',
          borderColor: 'border-blue-400/20'
        }
    }
  }

  const variantStyles = getVariantStyles()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="kvkk-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-500/20 to-orange-500/20 p-6 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 id="kvkk-title" className="text-lg font-semibold text-white">
                {title}
              </h2>
              <p className="text-white/60 text-sm">
                Validation error
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <p className="text-white/80 text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Quick Links */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-xs mb-3 font-medium">📋 Hızlı Erişim:</p>
            <div className="flex flex-wrap gap-2">
              <a
                href="/kvkk"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
              >
                <FileText className="w-3 h-3" />
                <span>KVKK Aydınlatma Metni</span>
              </a>
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
              >
                <FileText className="w-3 h-3" />
                <span>Kullanım Şartları</span>
              </a>
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
              >
                <FileText className="w-3 h-3" />
                <span>Gizlilik Politikası</span>
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white/70 hover:bg-white/5 hover:text-white bg-transparent rounded-xl"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              onClick={() => {
                onConfirm?.()
                onClose()
              }}
              className="flex-1 bg-gradient-to-r from-brand-primary to-purple-600 hover:from-brand-primary/90 hover:to-purple-600/90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              Tamam
            </Button>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-xs mt-4 text-center">
            Checkbox'ları işaretleyerek devam edebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
