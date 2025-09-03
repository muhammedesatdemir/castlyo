'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, AlertTriangle, Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ConsentSettings {
  kvkk: boolean
  marketing: boolean
  communication: boolean
  dataSharing: boolean
}

interface ContactPermission {
  id: string
  agencyName: string
  agencyLogo?: string
  grantedAt: string
  status: 'active' | 'revoked'
}

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [consents, setConsents] = useState<ConsentSettings>({
    kvkk: true, // KVKK consent cannot be revoked while using the platform
    marketing: true,
    communication: true,
    dataSharing: true
  })

  const [contactPermissions, setContactPermissions] = useState<ContactPermission[]>([
    {
      id: '1',
      agencyName: 'ABC Casting Ajansı',
      grantedAt: '2024-01-15',
      status: 'active'
    },
    {
      id: '2', 
      agencyName: 'XYZ Prodüksiyon',
      grantedAt: '2024-01-10',
      status: 'active'
    }
  ])

  const [isLoading, setIsLoading] = useState(false)

  const handleConsentChange = async (consentType: keyof ConsentSettings, value: boolean) => {
    if (consentType === 'kvkk') {
      // KVKK consent cannot be revoked while using platform
      alert('KVKK onayı platform kullanımı için zorunludur. Hesabınızı kapatmak için destek ile iletişime geçin.')
      return
    }

    setIsLoading(true)
    try {
      // TODO: API call to update consent
      console.log('Updating consent:', consentType, value)
      
      setConsents(prev => ({
        ...prev,
        [consentType]: value
      }))

      // Show confirmation
      const consentNames = {
        marketing: 'Pazarlama',
        communication: 'İletişim',
        dataSharing: 'Veri Paylaşımı'
      }
      
      alert(`${consentNames[consentType]} onayı ${value ? 'verildi' : 'geri çekildi'}.`)
    } catch (error) {
      console.error('Error updating consent:', error)
      alert('Onay güncellenirken hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevokeContactPermission = async (permissionId: string, agencyName: string) => {
    const confirmed = confirm(
      `${agencyName} ajansının iletişim bilgilerinize erişim iznini geri çekmek istediğinizden emin misiniz?\n\n` +
      `Bu işlem sonrası ajans sizinle platform dışından iletişim kuramayacak.`
    )

    if (!confirmed) return

    setIsLoading(true)
    try {
      // TODO: API call to revoke permission
      console.log('Revoking permission:', permissionId)
      
      setContactPermissions(prev => 
        prev.map(p => 
          p.id === permissionId 
            ? { ...p, status: 'revoked' as const }
            : p
        )
      )

      alert(`${agencyName} ajansının erişim izni geri çekildi.`)
    } catch (error) {
      console.error('Error revoking permission:', error)
      alert('İzin geri çekilirken hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDataExport = async () => {
    setIsLoading(true)
    try {
      // TODO: API call to export data
      console.log('Exporting user data')
      
      // Simulate export
      const exportData = {
        profile: { name: 'Kullanıcı', email: 'user@example.com' },
        consents: consents,
        contactPermissions: contactPermissions,
        auditLogs: []
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `castlyo-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Veri dışa aktarılırken hata oluştu.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-white/70 hover:text-white p-0 h-auto mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold text-white">Gizlilik Ayarları</h1>
              <p className="text-white/70">KVKK haklarınızı yönetin ve verilerinizi kontrol edin</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Consent Management */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
              <div className="flex items-center mb-6">
                <Shield className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">Onay Yönetimi</h2>
              </div>

              <div className="space-y-6">
                {/* KVKK Consent */}
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-green-200">KVKK Aydınlatma Metni</h3>
                    <p className="text-green-200/80 text-sm">Platform kullanımı için zorunlu onay</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-200 text-sm mr-3">Aktif</span>
                    <div className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </div>
                  </div>
                </div>

                {/* Marketing Consent */}
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Pazarlama İletişimi</h3>
                    <p className="text-white/70 text-sm">E-posta ve SMS ile pazarlama mesajları</p>
                  </div>
                  <button
                    onClick={() => handleConsentChange('marketing', !consents.marketing)}
                    disabled={isLoading}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      consents.marketing ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      consents.marketing ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                {/* Communication Consent */}
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Platform İletişimi</h3>
                    <p className="text-white/70 text-sm">İş fırsatları ve platform güncellemeleri</p>
                  </div>
                  <button
                    onClick={() => handleConsentChange('communication', !consents.communication)}
                    disabled={isLoading}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      consents.communication ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      consents.communication ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>

                {/* Data Sharing Consent */}
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Veri Paylaşımı</h3>
                    <p className="text-white/70 text-sm">Ajanslarla profil bilgisi paylaşımı</p>
                  </div>
                  <button
                    onClick={() => handleConsentChange('dataSharing', !consents.dataSharing)}
                    disabled={isLoading}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      consents.dataSharing ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      consents.dataSharing ? 'translate-x-6' : 'translate-x-0.5'
                    }`}></div>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-200 text-sm">
                      <strong>Önemli:</strong> Onayları geri çektiğinizde yeni veri paylaşımları durdurulur. 
                      Mevcut izinler geçerliliğini korur ancak yeni erişimler engellenir.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Permissions */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">İletişim İzinleri</h2>
              
              <div className="space-y-4">
                {contactPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {permission.agencyName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{permission.agencyName}</h3>
                        <p className="text-white/70 text-sm">
                          İzin verildi: {new Date(permission.grantedAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        permission.status === 'active' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {permission.status === 'active' ? 'Aktif' : 'İptal Edildi'}
                      </span>
                      
                      {permission.status === 'active' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeContactPermission(permission.id, permission.agencyName)}
                          disabled={isLoading}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          İzni Geri Çek
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {contactPermissions.length === 0 && (
                  <div className="text-center py-8 text-white/70">
                    <p>Henüz hiçbir ajansa iletişim izni vermediniz.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Data Rights */}
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Veri Sahibi Haklarım</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={handleDataExport}
                  disabled={isLoading}
                  className="bg-blue-500/20 border border-blue-500/50 text-blue-200 hover:bg-blue-500/30 p-6 h-auto flex-col items-start"
                >
                  <Download className="w-6 h-6 mb-2" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Verilerimi İndir</h3>
                    <p className="text-sm opacity-80">Tüm kişisel verilerinizi JSON formatında indirin</p>
                  </div>
                </Button>
                
                <Button
                  onClick={() => {
                    const confirmed = confirm(
                      'Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz?\n\n' +
                      'Bu işlem geri alınamaz ve tüm verileriniz silinecektir.'
                    )
                    if (confirmed) {
                      alert('Hesap silme talebiniz alındı. 24 saat içinde işleme alınacaktır.')
                    }
                  }}
                  className="bg-red-500/20 border border-red-500/50 text-red-200 hover:bg-red-500/30 p-6 h-auto flex-col items-start"
                >
                  <Trash2 className="w-6 h-6 mb-2" />
                  <div className="text-left">
                    <h3 className="font-semibold mb-1">Hesabımı Sil</h3>
                    <p className="text-sm opacity-80">Hesabınızı ve tüm verilerinizi kalıcı olarak silin</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
