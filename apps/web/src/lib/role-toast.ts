import { toast } from '@/components/ui/toast'

export function showRoleMismatchToast(userRole: 'TALENT' | 'AGENCY') {
  const message = userRole === 'TALENT'
    ? 'Yetenek olarak giriş yaptınız. Ajans olarak başlamak için lütfen çıkış yapıp farklı bir e-posta ile ajans kaydı oluşturun.'
    : 'Ajans olarak giriş yaptınız. Yetenek olarak başlamak için lütfen çıkış yapıp farklı bir e-posta ile yetenek kaydı oluşturun.'
  
  toast.error('Rolüne uygun olmayan işlem', message, 5000)
}
