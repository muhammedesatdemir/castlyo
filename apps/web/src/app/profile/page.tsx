'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Plus, User, Building } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { profile, loading, error } = useProfile()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md w-full">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tekrar Dene
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // If no profile exists, show create profile options
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profilinizi Oluşturun</h1>
            <p className="text-lg text-gray-600 mt-2">
              Castlyo'da başarılı olmak için profilinizi tamamlamanız gerekiyor.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {session?.user?.role === 'TALENT' && (
              <Card className="p-6 text-center">
                <User className="h-16 w-16 text-brand-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Yetenek Profili</h3>
                <p className="text-gray-600 mb-4">
                  Yeteneklerinizi, deneyimlerinizi ve portföyünüzü showcase edin.
                </p>
                <Button 
                  onClick={() => router.push('/profile/create/talent')}
                  className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-700 hover:to-brand-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yetenek Profili Oluştur
                </Button>
              </Card>
            )}

            {session?.user?.role === 'AGENCY' && (
              <Card className="p-6 text-center">
                <Building className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Ajans Profili</h3>
                <p className="text-gray-600 mb-4">
                  Şirketinizi tanıtın ve doğru yetenekleri bulun.
                </p>
                <Button 
                  onClick={() => router.push('/profile/create/agency')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajans Profili Oluştur
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show existing profile
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {session?.user?.role === 'TALENT' ? (
            <TalentProfileView profile={profile} />
          ) : (
            <AgencyProfileView profile={profile} />
          )}
        </div>
      </div>
    </div>
  )
}

function TalentProfileView({ profile }: { profile: any }) {
  const router = useRouter()

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.firstName} {profile.lastName}
          </h1>
          {profile.displayName && (
            <p className="text-lg text-gray-600">{profile.displayName}</p>
          )}
          <p className="text-sm text-gray-500">{profile.city}, {profile.country}</p>
        </div>
        <Button 
          onClick={() => router.push('/profile/edit')}
          variant="outline"
        >
          Profili Düzenle
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Kişisel Bilgiler</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Cinsiyet:</span> {profile.gender}</p>
            {profile.height && <p><span className="font-medium">Boy:</span> {profile.height} cm</p>}
            {profile.weight && <p><span className="font-medium">Kilo:</span> {profile.weight} kg</p>}
            {profile.eyeColor && <p><span className="font-medium">Göz Rengi:</span> {profile.eyeColor}</p>}
            {profile.hairColor && <p><span className="font-medium">Saç Rengi:</span> {profile.hairColor}</p>}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Profesyonel Bilgiler</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Uzmanlık Alanları:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.specialties?.map((specialty: string) => (
                  <span key={specialty} className="inline-block bg-brand-100 text-brand-primary text-xs px-2 py-1 rounded">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-medium">Diller:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.languages?.map((language: string) => (
                  <span key={language} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {language}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {profile.bio && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Hakkımda</h3>
          <p className="text-gray-700">{profile.bio}</p>
        </div>
      )}
    </div>
  )
}

function AgencyProfileView({ profile }: { profile: any }) {
  const router = useRouter()

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.companyName}</h1>
          {profile.tradeName && (
            <p className="text-lg text-gray-600">{profile.tradeName}</p>
          )}
          <p className="text-sm text-gray-500">{profile.city}, {profile.country}</p>
          {profile.isVerified && (
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
              Doğrulanmış Ajans
            </span>
          )}
        </div>
        <Button 
          onClick={() => router.push('/profile/edit')}
          variant="outline"
        >
          Profili Düzenle
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">İletişim Bilgileri</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">İletişim Kişisi:</span> {profile.contactPerson}</p>
            {profile.contactEmail && <p><span className="font-medium">E-posta:</span> {profile.contactEmail}</p>}
            {profile.contactPhone && <p><span className="font-medium">Telefon:</span> {profile.contactPhone}</p>}
            {profile.website && (
              <p>
                <span className="font-medium">Website:</span>{' '}
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {profile.website}
                </a>
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Şirket Bilgileri</h3>
          <div className="space-y-2 text-sm">
            {profile.taxNumber && <p><span className="font-medium">Vergi No:</span> {profile.taxNumber}</p>}
            <div>
              <span className="font-medium">Uzmanlık Alanları:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.specialties?.map((specialty: string) => (
                  <span key={specialty} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {profile.description && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Şirket Açıklaması</h3>
          <p className="text-gray-700">{profile.description}</p>
        </div>
      )}

      {profile.address && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Adres</h3>
          <p className="text-gray-700">{profile.address}</p>
        </div>
      )}
    </div>
  )
}
