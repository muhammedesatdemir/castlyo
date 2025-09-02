'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import InputMask from 'react-input-mask'
import { 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  Award,
  Lock,
  User,
  MapPin,
  FileText,
  Hash,
  Briefcase
} from 'lucide-react'
import { 
  agencyRegistrationSchema, 
  type AgencyRegistrationFormData 
} from '@/lib/validations/auth'
import {
  AGENCY_SPECIALTIES,
  TURKISH_CITIES
} from '@/lib/constants'

interface AgencyRegistrationFormProps {
  onClose?: () => void
}

export default function AgencyRegistrationForm({ onClose }: AgencyRegistrationFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger
  } = useForm<AgencyRegistrationFormData>({
    resolver: zodResolver(agencyRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      specialties: [],
      kvkkConsent: false,
      marketingConsent: false
    }
  })

  const watchedSpecialties = watch('specialties') || []

  const onSubmit = async (data: AgencyRegistrationFormData) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'AGENCY'
        }),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const result = await response.json()
      
      alert('Ajans kaydınız başarıyla oluşturuldu! E-posta adresinizi kontrol ederek hesabınızı doğrulayın.')
      onClose?.()
      
    } catch (error) {
      console.error('Registration error:', error)
      alert('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(step)
    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid) {
      setStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (stepNumber: number): (keyof AgencyRegistrationFormData)[] => {
    switch (stepNumber) {
      case 1:
        return ['email', 'password', 'passwordConfirm', 'companyName', 'contactPerson']
      case 2:
        return ['phone', 'city', 'specialties']
      case 3:
        return ['kvkkConsent']
      default:
        return []
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-brand-500 bg-clip-text text-transparent mb-6">🏢 Ajans Bilgileri</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şirket Adı *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('companyName')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şirket adınız"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İletişim Kişisi *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('contactPerson')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ad soyad"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPerson.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@ajans.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('password')}
                    type="password"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="En az 8 karakter"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre Tekrar *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('passwordConfirm')}
                    type="password"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Şifrenizi tekrar girin"
                  />
                  {errors.passwordConfirm && (
                    <p className="mt-1 text-sm text-red-600">{errors.passwordConfirm.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-brand-500 bg-clip-text text-transparent mb-6">📋 Şirket Detayları</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <InputMask
                        mask="+90 (299) 999 99 99"
                        value={field.value || ''}
                        onChange={field.onChange}
                      >
                        {(inputProps: any) => (
                          <input
                            {...inputProps}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+90 (2XX) XXX XX XX"
                          />
                        )}
                      </InputMask>
                    )}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    {...register('city')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Şehir seçiniz</option>
                    {TURKISH_CITIES.map(city => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('website')}
                  type="url"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.ajans.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vergi Numarası
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  {...register('taxNumber')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10-11 haneli vergi numarası"
                />
                {errors.taxNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.taxNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Uzmanlık Alanları * (En az 1, en fazla 5)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {AGENCY_SPECIALTIES.map(specialty => (
                  <label key={specialty.value} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={watchedSpecialties.includes(specialty.value)}
                      onCheckedChange={() => {
                        const newSpecialties = watchedSpecialties.includes(specialty.value)
                          ? watchedSpecialties.filter(s => s !== specialty.value)
                          : [...watchedSpecialties, specialty.value]
                        setValue('specialties', newSpecialties.slice(0, 5))
                      }}
                    />
                    <span className="text-sm">{specialty.label}</span>
                  </label>
                ))}
              </div>
              {errors.specialties && (
                <p className="mt-1 text-sm text-red-600">{errors.specialties.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şirket Açıklaması
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Şirketinizi kısaca tanıtın..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-accent-blue to-brand-500 bg-clip-text text-transparent mb-6">🎯 Final Adım</h3>
            
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Controller
                  name="kvkkConsent"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1"
                    />
                  )}
                />
                <div className="text-sm text-gray-600">
                  <span className="text-red-600">*</span> 
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                    KVKK Aydınlatma Metni
                  </a>
                  'ni okudum ve kişisel verilerimin işlenmesini onaylıyorum.
                </div>
              </div>
              {errors.kvkkConsent && (
                <p className="text-sm text-red-600">{errors.kvkkConsent.message}</p>
              )}

              <div className="flex items-start space-x-3">
                <Controller
                  name="marketingConsent"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1"
                    />
                  )}
                />
                <div className="text-sm text-gray-600">
                  Pazarlama ve tanıtım amaçlı elektronik iletiler almak istiyorum.
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {[
            { number: 1, title: 'Hesap', icon: '🏢' },
            { number: 2, title: 'Şirket', icon: '📋' },
            { number: 3, title: 'Tamamla', icon: '🎯' }
          ].map((stepInfo) => (
            <div key={stepInfo.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step >= stepInfo.number
                      ? 'bg-gradient-to-r from-accent-blue to-brand-500 text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  }`}
                >
                  {step >= stepInfo.number ? stepInfo.icon : stepInfo.number}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  step >= stepInfo.number ? 'text-accent-blue' : 'text-gray-400'
                }`}>
                  {stepInfo.title}
                </span>
              </div>
              {stepInfo.number < 3 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      step > stepInfo.number 
                        ? 'bg-gradient-to-r from-accent-blue to-brand-500' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Adım {step} / 3 - Casting dünyasına adım at! 🎬
          </p>
        </div>
      </div>

      {renderStep()}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8 border-t border-gray-100 dark:border-gray-800">
        {step > 1 && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            className="px-8 py-3 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          >
            👈 Önceki
          </Button>
        )}
        
        <div className="ml-auto">
          {step < 3 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="bg-gradient-to-r from-accent-blue to-brand-500 hover:scale-105 px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Devam Et 🚀
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting || !isValid}
              className="bg-gradient-to-r from-accent-blue to-brand-500 hover:scale-105 px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Kayıt Gerçekleşiyor...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-5 w-5" />
                  Ajansımı Başlat! 🎯
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
