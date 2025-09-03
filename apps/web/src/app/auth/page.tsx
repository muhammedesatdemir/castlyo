'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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

  useEffect(() => {
    if (urlRole && ['talent', 'agency'].includes(urlRole)) {
      setRole(urlRole)
      // If role is specified, default to register mode
      setMode('register')
    }
  }, [urlRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'register') {
      // Validate required consents
      if (!formData.kvkkConsent || !formData.termsConsent) {
        alert('KVKK Aydınlatma Metni ve Kullanım Şartlarını kabul etmeniz gerekmektedir.')
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        alert('Şifreler eşleşmiyor!')
        return
      }
    }

    try {
      // TODO: API call for login/register
      console.log('Auth request:', { mode, role, formData })
      
      // On success, redirect to next URL or onboarding
      if (mode === 'register') {
        const onboardingUrl = `/onboarding/${role}`
        router.push(nextUrl || onboardingUrl)
      } else {
        router.push(nextUrl || '/profile')
      }
    } catch (error) {
      console.error('Auth error:', error)
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
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3 mt-6"
            >
              {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol ve Devam Et'}
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
    </div>
  )
}
