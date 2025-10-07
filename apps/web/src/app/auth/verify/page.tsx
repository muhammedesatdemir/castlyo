'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'

function VerifyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('')

  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!token) {
      setVerificationStatus('error')
      setMessage('Geçersiz doğrulama linki')
      return
    }

    verifyEmail(token)
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/v1/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const result = await response.json()
      const ok = (result?.success ?? result?.ok ?? response.ok) as boolean

      if (ok) {
        setVerificationStatus('success')
        setMessage(result?.message || 'E-posta adresiniz başarıyla doğrulandı!')
        toast.success('Doğrulama Başarılı! 🎉', 'Artık giriş yapabilirsiniz.')
        
        // 3 saniye sonra login sayfasına yönlendir
        setTimeout(() => {
          const cb = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('callbackUrl') : null
          const target = `/auth?mode=login&message=verification-success${cb ? `&callbackUrl=${encodeURIComponent(cb)}` : ''}`
          router.replace(target)
        }, 3000)
      } else {
        setVerificationStatus('error')
        setMessage(result?.message || 'Doğrulama işlemi başarısız')
        toast.error('Doğrulama Hatası', result?.message)
      }
    } catch (error) {
      console.error('Verification error:', error)
      setVerificationStatus('error')
      setMessage('Doğrulama sırasında bir hata oluştu')
      toast.error('Hata', 'Doğrulama sırasında bir hata oluştu')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-secondary to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {verificationStatus === 'pending' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              E-posta Doğrulanıyor...
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Lütfen bekleyin, e-posta adresiniz doğrulanıyor.
            </p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Doğrulama Başarılı!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              3 saniye içinde giriş sayfasına yönlendirileceksiniz...
            </p>
            <Button 
              onClick={() => router.push('/auth?mode=login')}
              className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-105 transition-all duration-300"
            >
              Hemen Giriş Yap
            </Button>
          </>
        )}

        {verificationStatus === 'error' && (
          <>
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Doğrulama Başarısız
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth?mode=register')}
                className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-105 transition-all duration-300"
              >
                Yeni Kayıt Yap
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/auth?mode=login')}
                className="w-full"
              >
                Giriş Sayfasına Dön
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-brand-primary via-brand-secondary to-purple-600 flex items-center justify-center"><div className="text-white">Doğrulama yükleniyor...</div></div>}>
      <VerifyPageContent />
    </Suspense>
  )
}