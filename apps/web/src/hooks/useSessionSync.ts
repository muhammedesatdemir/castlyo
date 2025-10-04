import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { resetApiGuard } from '@/lib/api-guard';

export function useSessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Yeni oturum açıldı - API guard'ı sıfırla
      resetApiGuard();
    } else if (status === 'unauthenticated') {
      // Oturum kapandı - API guard'ı sıfırla
      resetApiGuard();
    }
  }, [status, session]);
}
