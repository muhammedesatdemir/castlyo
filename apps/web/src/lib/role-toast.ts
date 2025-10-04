'use client';
import { toast } from '@/components/ui/toast';

const ROLE_TOAST_ID = 'role-mismatch';

export function showRoleMismatchToast(userRole: 'TALENT' | 'AGENCY') {
  const message = userRole === 'TALENT'
    ? 'Yetenek hesabıyla Ajans onboardingine erişemezsiniz.'
    : 'Ajans hesabıyla Yetenek onboardingine erişemezsiniz.';
  
  // Aynı toast'ı iki kez basmayı önlemek için id kullan
  toast.error('Erişim engellendi', message, 5000, ROLE_TOAST_ID);
}

export function dismissRoleMismatchToast() {
  toast.dismiss(ROLE_TOAST_ID);
}