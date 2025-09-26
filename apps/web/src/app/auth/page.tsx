'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { NotificationPermission } from '@/components/ui/notification-permission'
import { KvkkDialog } from '@/components/ui/kvkk-dialog'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type AuthMode = 'login' | 'register'
type UserRole = 'talent' | 'agency'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [mode, setMode] = useState<AuthMode>('login')
  const [role, setRole] = useState<UserRole>('talent')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Dialog states
  const [showKvkkDialog, setShowKvkkDialog] = useState(false)
  const [dialogMessage, setDialogMessage] = useState('')
  const [dialogTitle, setDialogTitle] = useState('')
  
  // Email verification state
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    kvkkConsent: false,
    marketingConsent: false,
    termsConsent: false
  })

  // Get next URL and role from URL params
  const nextUrl = searchParams.get('next')
  const urlRole = searchParams.get('role') as UserRole
  
  // Check for verification status
  const verified = searchParams.get('verified')
  const verificationMessage = searchParams.get('message')

  useEffect(() => {
    if (urlRole && ['talent', 'agency'].includes(urlRole)) {
      setRole(urlRole)
      // If role is specified, default to register mode
      setMode('register')
    }
  }, [urlRole])
  
  // Handle verification status
  useEffect(() => {
    if (verified && verificationMessage) {
      if (verified === 'true') {
        setDialogTitle('E-posta Doğrulandı! ✅')
        setDialogMessage(verificationMessage)
        setEmailVerificationRequired(false)
        setMode('login') // Switch to login mode
      } else {
        setDialogTitle('Doğrulama Hatası ❌')
        setDialogMessage(verificationMessage)
      }
      setShowKvkkDialog(true)
    }
  }, [verified, verificationMessage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'register') {
      // Validate required consents
      if (!formData.kvkkConsent || !formData.termsConsent) {
        setDialogTitle('KVKK ve Kullanım Şartları')
        setDialogMessage('KVKK Aydınlatma Metni ve Kullanım Şartlarını kabul etmeniz gerekmektedir.')
        setShowKvkkDialog(true)
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        setDialogTitle('Şifre Uyarısı')
        setDialogMessage('Şifreler eşleşmiyor! Lütfen şifrelerinizi kontrol edin.')
        setShowKvkkDialog(true)
        return
      }

      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(formData.password)) {
        setDialogTitle('Şifre Güvenliği')
        setDialogMessage('Şifre en az 8 karakter olmalı ve en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter (@$!%*?&) içermelidir.')
        setShowKvkkDialog(true)
        return
      }
    }

    setIsLoading(true)
    try {
      if (mode === 'register') {
        logger.info('AUTH', 'Starting registration process', { email: formData.email, role: role.toUpperCase() })
        
        // Kayıt işlemi için API çağrısı
        const payload = {
          email: formData.email,
          password: formData.password,
          passwordConfirm: formData.confirmPassword,
          role: role.toUpperCase(),
          kvkkConsent: formData.kvkkConsent,
          termsConsent: formData.termsConsent,
          marketingConsent: formData.marketingConsent,
          // Temporary dummy values for profile fields
          firstName: 'Test',
          lastName: 'User',
          gender: 'OTHER' as const,
          city: 'Istanbul',
          experience: 'BEGINNER' as const,
          specialties: ['Model'],
          languages: ['TR'],
        }
        
        // Development için payload'ı logla
        if (process.env.NODE_ENV === 'development') {
          console.log('REGISTER PAYLOAD', payload);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        })

        // Log API call details
        logger.logApiCall('POST', '/api/v1/auth/register', payload, null, response.status)

        if (!response.ok) {
          const errorResult = await response.json().catch(() => ({}))
          logger.error('AUTH', 'Registration failed', { status: response.status, error: errorResult })
          
          // Duplicate email için düzgün mesaj
          const errorMessage = response.status === 409
            ? 'Bu e-posta zaten kayıtlı.'
            : errorResult.message || `Kayıt başarısız (HTTP ${response.status}).`;
          
          throw new Error(errorMessage)
        }

        const result = await response.json()

        logger.info('AUTH', 'Registration successful', { userId: result.user?.id, email: formData.email })
        
        // Store tokens if available (for immediate login)
        if (result.accessToken && result.refreshToken) {
          // Store tokens in localStorage for immediate use
          localStorage.setItem('accessToken', result.accessToken)
          localStorage.setItem('refreshToken', result.refreshToken)
          logger.info('AUTH', 'Tokens stored for immediate use')
        }
        
        // Check if email verification is required
        if (result.user?.status === 'PENDING') {
          setEmailVerificationRequired(true)
          setRegisteredEmail(formData.email)
          setDialogTitle('E-posta Doğrulaması Gerekli 📧')
          setDialogMessage(`${formData.email} adresine gönderilen doğrulama linkine tıklayarak hesabınızı aktifleştirin. Geliştirme ortamında: Konsol'da doğrulama linkini görebilirsiniz.`)
          setShowKvkkDialog(true)
        } else {
          // Email verification not required, show success and switch to login
          setDialogTitle('Kayıt Başarılı! 🎉')
          setDialogMessage('Kayıt işleminiz başarıyla tamamlandı! Şimdi giriş yapabilirsiniz.')
          setShowKvkkDialog(true)
          
          // Kayıt sonrası login moduna geç
          setMode('login')
          setFormData({
            email: formData.email, // Email'i koruyalım
            password: '',
            confirmPassword: '',
            kvkkConsent: false,
            marketingConsent: false,
            termsConsent: false
          })
        }
        
        logger.info('NAVIGATION', 'Switched to login mode after registration', { email: formData.email })
        
      } else {
        logger.info('AUTH', 'Starting login process', { email: formData.email })
        
        // Login işlemi için NextAuth kullan
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
          callbackUrl: nextUrl || '/onboarding/talent',
        })

        logger.logAuthAction('login', !!result?.ok, { email: formData.email, error: result?.error })

        if (result?.error) {
          logger.error('AUTH', 'Login failed', { email: formData.email, error: result.error })
          
          // Özel hata mesajları
          if (result.error === 'CredentialsSignin') {
            // Check if this is due to email verification
            if (formData.email === registeredEmail && emailVerificationRequired) {
              setDialogTitle('E-posta Doğrulaması Gerekli 📧')
              setDialogMessage('Hesabınıza giriş yapmadan önce e-posta adresinizi doğrulamanız gerekmektedir. E-posta kutunuzu kontrol edin.')
            } else {
              setDialogTitle('Giriş Hatası')
              setDialogMessage('Geçersiz e-posta adresi veya şifre. Lütfen bilgilerinizi kontrol edin.')
            }
            setShowKvkkDialog(true)
            return
          } else if (result.error === 'AccessDenied') {
            setDialogTitle('Erişim Reddedildi')
            setDialogMessage('Hesap erişimi reddedildi. Lütfen destek ekibi ile iletişime geçin.')
            setShowKvkkDialog(true)
            return
          } else if (result.error === 'EMAIL_NOT_VERIFIED' || result.error.includes('E-posta doğrulaması')) {
            setDialogTitle('E-posta Doğrulaması Gerekli 📧')
            setDialogMessage('Hesabınıza giriş yapmadan önce e-posta adresinizi doğrulamanız gerekmektedir. E-posta kutunuzu kontrol edin veya konsol\'dan doğrulama linkini kullanın.')
            setShowKvkkDialog(true)
            return
          } else if (result.error === 'USER_NOT_ACTIVE') {
            setDialogTitle('Hesap Aktif Değil')
            setDialogMessage('Hesabınız henüz aktif değil. Lütfen e-posta doğrulamasını tamamlayın.')
            setShowKvkkDialog(true)
            return
          } else {
            throw new Error('Giriş yapılamadı. Lütfen tekrar deneyin.')
          }
        }

        if (result?.ok && result.url) {
          logger.info('AUTH', 'Login successful', { email: formData.email })
          logger.info('NAVIGATION', 'Redirecting after login', { destination: result.url })
          // Login başarılı, NextAuth'ın önerdiği URL'e yönlendir
          router.replace(result.url)
        } else if (result?.ok) {
          logger.info('AUTH', 'Login successful', { email: formData.email })
          logger.info('NAVIGATION', 'Redirecting after login', { destination: nextUrl || '/onboarding/talent' })
          // Fallback: callbackUrl'e yönlendir
          router.replace(nextUrl || '/onboarding/talent')
        }
      }
    } catch (error) {
      logger.error('AUTH', 'Auth process failed', { mode, email: formData.email, error: error.message })
      console.error('Auth error:', error)
      
      // Duplicate e-posta durumu için özel mesaj
      const errorMessage = error.message?.includes('zaten kayıtlı') 
        ? error.message 
        : error instanceof Error ? error.message : 'Bir hata oluştu. Lütfen tekrar deneyin.';
        
      setDialogTitle('Hata Oluştu')
      setDialogMessage(errorMessage)
      setShowKvkkDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    // Reset form when switching modes
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      kvkkConsent: false,
      marketingConsent: false,
      termsConsent: false
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-white/70 hover:text-white p-0 h-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri Dön
          </Button>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </h1>
            <p className="text-white/70">
              {mode === 'login' 
                ? 'Hesabına giriş yap ve devam et'
                : `${role === 'talent' ? 'Yetenek' : 'Ajans'} olarak kayıt ol`
              }
            </p>
          </div>

          {/* Role selector for register mode */}
          {mode === 'register' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/90 mb-3">
                Hesap Türü
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('talent')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    role === 'talent'
                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                      : 'border-white/20 text-white/70 hover:border-white/40'
                  }`}
                >
                  🎭 Yetenek
                </button>
                <button
                  type="button"
                  onClick={() => setRole('agency')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    role === 'agency'
                      ? 'border-brand-primary bg-brand-primary/20 text-white'
                      : 'border-white/20 text-white/70 hover:border-white/40'
                  }`}
                >
                  🏢 Ajans
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                E-posta Adresi
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                placeholder="ornek@email.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Şifre
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Consents (register only) */}
            {mode === 'register' && (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h3 className="text-sm font-medium text-white/90 mb-3">
                  Onaylar ve Sözleşmeler
                </h3>
                
                {/* KVKK Consent */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="kvkk-consent"
                    checked={formData.kvkkConsent}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, kvkkConsent: checked as boolean })
                    }
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-brand-primary"
                  />
                  <label htmlFor="kvkk-consent" className="text-sm text-white/80 leading-relaxed">
                    <Link href="/kvkk" target="_blank" className="text-brand-primary hover:underline">
                      KVKK Aydınlatma Metni
                    </Link>
                    'ni okudum ve anladım. Kişisel verilerimin işlenmesine onay veriyorum.
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                </div>

                {/* Terms Consent */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms-consent"
                    checked={formData.termsConsent}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, termsConsent: checked as boolean })
                    }
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-brand-primary"
                  />
                  <label htmlFor="terms-consent" className="text-sm text-white/80 leading-relaxed">
                    <Link href="/terms" target="_blank" className="text-brand-primary hover:underline">
                      Kullanım Şartları
                    </Link>
                    'nı ve 
                    <Link href="/privacy" target="_blank" className="text-brand-primary hover:underline ml-1">
                      Gizlilik Politikası
                    </Link>
                    'nı okudum ve kabul ediyorum.
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                </div>

                {/* Marketing Consent */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketing-consent"
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, marketingConsent: checked as boolean })
                    }
                    className="mt-0.5 border-white/30 data-[state=checked]:bg-brand-primary"
                  />
                  <label htmlFor="marketing-consent" className="text-sm text-white/80 leading-relaxed">
                    Pazarlama amaçlı e-posta ve SMS gönderilmesine onay veriyorum. (İsteğe bağlı)
                  </label>
                </div>

                {/* Privacy Notice */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
                  <p className="text-xs text-blue-200">
                    🔒 <strong>Gizlilik Güvencesi:</strong> İletişim bilgileriniz sadece onayınızla paylaşılır. 
                    Platform dışında hiçbir şekilde üçüncü taraflarla paylaşılmaz.
                  </p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 mt-6"
            >
              {isLoading ? 'İşleniyor...' : (mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Devam Et')}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="text-center mt-6 pt-6 border-t border-white/10">
            <p className="text-white/70">
              {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
            </p>
            <button
              type="button"
              onClick={toggleMode}
              className="text-brand-primary hover:text-brand-primary/80 font-medium mt-1"
            >
              {mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
            </button>
          </div>
        </div>
      </div>

      {/* Modern Notification Permission Popup */}
      <NotificationPermission 
        onPermissionChange={(permission) => {
          logger.info('NOTIFICATION', 'Permission changed', { permission })
        }}
      />

      {/* Modern KVKK Dialog - replaces all alert() calls */}
      <KvkkDialog
        open={showKvkkDialog}
        onClose={() => setShowKvkkDialog(false)}
        title={dialogTitle}
        message={dialogMessage}
        variant={
          dialogTitle.includes('Başarılı') || dialogTitle.includes('Doğrulandı') 
            ? 'success' 
            : dialogTitle.includes('Hata') || dialogTitle.includes('Geçersiz')
              ? 'error'
              : 'default'
        }
        onConfirm={() => {
          // Auto-focus checkboxes if it's a validation error
          if (dialogTitle.includes('KVKK')) {
            // Scroll to checkboxes section
            setTimeout(() => {
              const checkboxes = document.querySelector('[name="kvkkConsent"]')
              checkboxes?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        }}
      />
    </div>
  )
}
