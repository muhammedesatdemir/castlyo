'use client'

import { Button } from './button'
import { X, Bell, BellOff } from 'lucide-react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'

interface NotificationPermissionProps {
  onPermissionChange?: (permission: NotificationPermission) => void
}

export function NotificationPermission({ onPermissionChange }: NotificationPermissionProps) {
  const { shouldShowPopup, requestPermission, dismissPopup, isSupported } = useNotificationPermission()

  const handleAllow = async () => {
    const result = await requestPermission()
    onPermissionChange?.(result)
  }

  const handleDeny = () => {
    dismissPopup()
    onPermissionChange?.('denied')
  }

  if (!shouldShowPopup || !isSupported) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-brand-primary/20 to-purple-600/20 p-6 pb-4">
          <button
            onClick={handleDeny}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Bildirimler
              </h3>
              <p className="text-white/60 text-sm">
                castlyo.com
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          <p className="text-white/80 text-sm leading-relaxed mb-6">
            <strong>KVKK Aydınlatma Metni ve Kullanım Şartlarını</strong> kabul etmeniz gerekmektedir.
            <br /><br />
            Ayrıca yeni iş fırsatları ve platform güncellemeleri hakkında bildirim almak ister misiniz?
          </p>

          {/* Privacy Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
            <p className="text-amber-200 text-xs flex items-start space-x-2">
              <span className="text-amber-400 mt-0.5">🔒</span>
              <span>
                <strong>Gizlilik Güvencesi:</strong> İletişim bilgileriniz sadece onayınızla 
                paylaşılır. Platform dışında hiçbir şekilde üçüncü taraflarla paylaşılmaz.
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleAllow}
              className="w-full bg-gradient-to-r from-brand-primary to-purple-600 hover:from-brand-primary/90 hover:to-purple-600/90 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              <Bell className="w-4 h-4 mr-2" />
              Tamam
            </Button>
            
            <Button
              onClick={handleDeny}
              variant="outline"
              className="w-full border-white/20 text-white/70 hover:bg-white/5 hover:text-white bg-transparent rounded-xl"
            >
              <BellOff className="w-4 h-4 mr-2" />
              Şimdi Değil
            </Button>
          </div>

          {/* Footer */}
          <p className="text-white/40 text-xs mt-4 text-center">
            Bu ayarı daha sonra profil ayarlarından değiştirebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
