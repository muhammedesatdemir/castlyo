'use client';

import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';

function showRoleToast(userRole?: string | null, targetRole?: string | null) {
  if (userRole === 'TALENT' && targetRole === 'AGENCY') {
    toast.error(
      'Yetenek olarak giriş yaptınız. Ajans olarak başlamak için lütfen çıkış yapıp farklı bir e-posta ile ajans kaydı oluşturun.'
    );
  } else if (userRole === 'AGENCY' && targetRole === 'TALENT') {
    toast.error(
      'Ajans olarak giriş yaptınız. Yetenek olarak başlamak için lütfen çıkış yapıp farklı bir e-posta ile yetenek kaydı oluşturun.'
    );
  } else {
    toast.error('Bu işlem mevcut rolünüz için uygun değil.');
  }
}

export default function RoleGateGlobalGuard() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // En yakın role-etiketli elementi bul
      const el = target.closest<HTMLElement>('[data-role-target]');
      if (!el) return;

      const userRole = el.getAttribute('data-role-user');
      const targetRole = el.getAttribute('data-role-target');
      const mismatchAttr = el.getAttribute('data-role-mismatch');

      const isMismatch = mismatchAttr === 'true' ||
        (!!userRole && !!targetRole && userRole !== targetRole);

      if (!isMismatch) return;

      // Navigasyonu kesin olarak engelle + toast
      e.preventDefault();
      e.stopPropagation();
      showRoleToast(userRole, targetRole);
    };

    // capture fazında hem sol tık hem orta tık
    document.addEventListener('click', handler, true);
    document.addEventListener('auxclick', handler, true);

    return () => {
      document.removeEventListener('click', handler, true);
      document.removeEventListener('auxclick', handler, true);
    };
  }, []);

  return null;
}
