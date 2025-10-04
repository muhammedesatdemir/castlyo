'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useMe } from '@/hooks/useMe';
import { toast } from '@/components/ui/toast';

export default function RoleGateGlobalGuard() {
  const pathname = usePathname();
  const { data: me, isLoading: isMeLoading } = useMe();

  // Role mismatch toast logic based on current path
  useEffect(() => {
    if (isMeLoading || !me?.role) return;

    const mismatch =
      (pathname.startsWith('/onboarding/agency') && me.role === 'TALENT') ||
      (pathname.startsWith('/onboarding/talent') && me.role === 'AGENCY');

    if (mismatch) {
      toast.error('Erişim engellendi', 'Yetenek hesabıyla Ajans onboardingine erişemezsiniz.', 5000, 'role-mismatch');
    } else {
      toast.dismiss('role-mismatch');
    }
  }, [isMeLoading, pathname, me?.role]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Only work on opt-in elements with data-role-guard="1"
      const el = target.closest<HTMLElement>('[data-role-guard="1"]');
      if (!el) return;

      const userRole = el.getAttribute('data-role-user') as 'TALENT' | 'AGENCY' | null;
      const targetRole = el.getAttribute('data-role-target') as 'TALENT' | 'AGENCY' | null;
      const mismatchAttr = el.getAttribute('data-role-mismatch');

      const isMismatch = mismatchAttr === 'true' ||
        (!!userRole && !!targetRole && userRole !== targetRole);

      if (!isMismatch || !userRole) return;

      // Prevent navigation
      e.preventDefault();
      e.stopPropagation();

      // Show appropriate error message
      const message = userRole === 'TALENT'
        ? 'Yetenek hesabıyla Ajans onboardingine erişemezsiniz.'
        : 'Ajans hesabıyla Yetenek onboardingine erişemezsiniz.';
      
      toast.error('Erişim engellendi', message, 5000, 'role-mismatch');
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
