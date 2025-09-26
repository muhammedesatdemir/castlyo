'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { toast } from '@/components/ui/toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import InputMask from 'react-input-mask'
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Star, 
  Lock, 
  Calendar,
  MapPin,
  FileText,
  Award,
  Languages,
  Palette,
  Eye,
  Ruler,
  Weight
} from 'lucide-react'
import { 
  talentRegistrationSchema, 
  type TalentRegistrationFormData 
} from '@/lib/validations/auth'
import { registerUser } from '@/lib/auth/register'
import {
  GENDER_OPTIONS,
  EXPERIENCE_LEVELS,
  TALENT_SPECIALTIES,
  TALENT_SKILLS,
  LANGUAGES,
  TURKISH_CITIES,
  EYE_COLORS,
  HAIR_COLORS
} from '@/lib/constants'

interface TalentRegistrationFormProps {
  onClose?: () => void
}

export default function TalentRegistrationForm({ onClose }: TalentRegistrationFormProps) {
  const router = useRouter()
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
  } = useForm<TalentRegistrationFormData>({
    resolver: zodResolver(talentRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      specialties: [],
      skills: [],
      languages: ['TR'],
      kvkkConsent: false,
      termsConsent: false,
      marketingConsent: false
    }
  })

  const watchedSpecialties = watch('specialties') || []
  const watchedSkills = watch('skills') || []
  const watchedLanguages = watch('languages') || []

  const onSubmit = async (data: TalentRegistrationFormData) => {
    try {
      setIsSubmitting(true)
      
      // Development için payload'ı logla
      if (process.env.NODE_ENV === 'development') {
        console.log('REGISTER PAYLOAD', {
          ...data,
          role: 'TALENT',
          kvkkConsent: true,
          termsConsent: true,
          marketingConsent: !!data.marketingConsent,
        });
      }
      
      const result = await registerUser({
        ...data,
        role: 'TALENT',
        kvkkConsent: true,
        termsConsent: true,
        marketingConsent: !!data.marketingConsent,
      })
      
      toast.success('Kayıt Başarılı! 🎉', 'Yetenek kaydınız başarıyla oluşturuldu! E-posta adresinizi kontrol ederek hesabınızı doğrulayın.')
      
      // Kayıt sonrası login sayfasına yönlendir
      onClose?.()
      router.replace('/auth?mode=login&message=registration-success')
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Duplicate e-posta durumu için özel mesaj
      const errorMessage = error.message.includes('zaten kayıtlı') 
        ? error.message 
        : 'Form bilgilerini kontrol edin.';
        
      toast.error('Kayıt Hatası', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(step)
    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid) {
      setStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (stepNumber: number): (keyof TalentRegistrationFormData)[] => {
    switch (stepNumber) {
      case 1:
        return ['email', 'password', 'passwordConfirm', 'firstName', 'lastName']
      case 2:
        return ['phone', 'dateOfBirth', 'gender', 'city']
      case 3:
        return ['experience', 'specialties', 'languages']
      case 4:
        return ['kvkkConsent', 'termsConsent']
      default:
        return []
    }
  }

  const toggleArrayValue = (array: string[], value: string, setter: (values: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value))
    } else {
      setter([...array, value])
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-6">🔐 Hesap Bilgilerin</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('firstName')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Adınız"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soyad *
                </label>
                <input
                  {...register('lastName')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="Soyadınız"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="ornek@email.com"
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-6">👤 Kendini Tanıt</h3>
            
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
                      mask="+90 (599) 999 99 99"
                      value={field.value || ''}
                      onChange={field.onChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      placeholder="+90 (5XX) XXX XX XX"
                    />
                  )}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doğum Tarihi
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('dateOfBirth')}
                    type="date"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cinsiyet *
                </label>
                <select
                  {...register('gender')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  {GENDER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
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
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hakkımda
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  placeholder="Kendinizi kısaca tanıtın..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-6">🎭 Yeteneklerin</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deneyim Seviyesi *
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  {...register('experience')}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="">Deneyim seviyenizi seçiniz</option>
                  {EXPERIENCE_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.experience && (
                  <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Uzmanlık Alanları * (En az 1, en fazla 5)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {TALENT_SPECIALTIES.map(specialty => (
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
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Diller * (En az 1, en fazla 5)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(language => (
                  <label key={language.value} className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      checked={watchedLanguages.includes(language.value)}
                      onCheckedChange={() => {
                        const newLanguages = watchedLanguages.includes(language.value)
                          ? watchedLanguages.filter(l => l !== language.value)
                          : [...watchedLanguages, language.value]
                        setValue('languages', newLanguages.slice(0, 5))
                      }}
                    />
                    <span className="text-sm">{language.label}</span>
                  </label>
                ))}
              </div>
              {errors.languages && (
                <p className="mt-1 text-sm text-red-600">{errors.languages.message}</p>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-6">✨ Son Dokunuşlar</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Boy (cm)
                </label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('height', { valueAsNumber: true })}
                    type="number"
                    min="120"
                    max="250"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Örn: 175"
                  />
                  {errors.height && (
                    <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kilo (kg)
                </label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    {...register('weight', { valueAsNumber: true })}
                    type="number"
                    min="30"
                    max="200"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Örn: 70"
                  />
                  {errors.weight && (
                    <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Göz Rengi
                </label>
                <div className="relative">
                  <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    {...register('eyeColor')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {EYE_COLORS.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saç Rengi
                </label>
                <div className="relative">
                  <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    {...register('hairColor')}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="">Seçiniz</option>
                    {HAIR_COLORS.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

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
                  <a href="/privacy" target="_blank" className="text-brand-primary hover:underline">
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
                  name="termsConsent"
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
                  <a href="/terms" target="_blank" className="text-brand-primary hover:underline">
                    Kullanım Şartları
                  </a>
                  'nı okudum ve kabul ediyorum.
                </div>
              </div>
              {errors.termsConsent && (
                <p className="text-sm text-red-600">{errors.termsConsent.message}</p>
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
            { number: 1, title: 'Hesap', icon: '🔐' },
            { number: 2, title: 'Kişisel', icon: '👤' },
            { number: 3, title: 'Profesyonel', icon: '🎭' },
            { number: 4, title: 'Tamamla', icon: '✨' }
          ].map((stepInfo) => (
            <div key={stepInfo.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                    step >= stepInfo.number
                      ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg scale-110'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                  }`}
                >
                  {step >= stepInfo.number ? stepInfo.icon : stepInfo.number}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  step >= stepInfo.number ? 'text-brand-primary' : 'text-gray-400'
                }`}>
                  {stepInfo.title}
                </span>
              </div>
              {stepInfo.number < 4 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      step > stepInfo.number 
                        ? 'bg-gradient-to-r from-brand-primary to-brand-secondary' 
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
            Adım {step} / 4 - Sahneye çıkışın çok yakın! 🎬
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
          {step < 4 ? (
            <Button 
              type="button" 
              onClick={nextStep}
              className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-105 px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              Devam Et 🚀
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={isSubmitting || !isValid}
              className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:scale-105 px-8 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sihir Gerçekleşiyor...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-5 w-5" />
                  Sahneye Çık! ✨
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}

