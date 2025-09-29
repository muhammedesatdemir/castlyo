'use client';

import { useEffect } from 'react';
import { showRoleMismatchToast } from '@/lib/role-toast';

// Dedupe logic: prevent multiple toasts within 400ms
let lastToastAt = 0;
const shouldSkip = (gap = 400) => {
  const now = Date.now();
  if (now - lastToastAt < gap) return true;
  lastToastAt = now;
  return false;
};

export default function RoleGateGlobalGuard() {
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

      // 🔒 çift olayı sustur
      if (shouldSkip()) return;

      showRoleMismatchToast(userRole);
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
