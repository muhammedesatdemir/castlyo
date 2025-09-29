'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

type Role = 'TALENT' | 'AGENCY' | 'ADMIN';
type Props = {
  children: React.ReactNode;
  targetRole: 'TALENT' | 'AGENCY';
  href?: string;
  to?: string; // backward compatibility
  userRole?: 'TALENT' | 'AGENCY' | 'ADMIN' | null;
  className?: string;
};

export default function RoleGateCTA({
  children,
  targetRole,
  href,
  to, // backward compatibility
  userRole,
  className,
}: Props) {
  const { data, status } = useSession();
  const router = useRouter();
  
  // Use passed userRole or get from session
  const sessionUserRole = (data?.user as any)?.role as Role | undefined;
  const actualUserRole = userRole ?? sessionUserRole;
  
  const isAuthed = !!actualUserRole;
  const isMismatch = isAuthed && actualUserRole !== targetRole;
  
  // Use href or to for backward compatibility
  const targetHref = href ?? to ?? '';

  function showMessage() {
    if (actualUserRole === 'TALENT' && targetRole === 'AGENCY') {
      toast.error(
        'Yetenek olarak giriş yaptınız. Ajans olarak başlamak için lütfen çıkış yapıp farklı bir e-posta ile ajans kaydı oluşturun.'
      );
    } else if (actualUserRole === 'AGENCY' && targetRole === 'TALENT') {
      toast.error(
        'Ajans olarak giriş yaptınız. Yetenek olarak başlamak için lütfen çıkış yapıp farklı bir e-posta ile yetenek kaydı oluşturun.'
      );
    } else {
      toast.error('Bu işlem mevcut rolünüz için uygun değil.');
    }
  }

  const go = () => router.push(targetHref);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        // BUTONU ASLA disable ETME!
        // disabled={false} demek için:
        aria-disabled={isMismatch}
        data-role-user={actualUserRole ?? ''}
        data-role-target={targetRole}
        data-role-mismatch={isMismatch ? 'true' : 'false'}
        onClick={() => (isMismatch ? showMessage() : go())}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && isMismatch) {
            e.preventDefault();
            showMessage();
          }
        }}
        // Görsel "pasif"lik sadece stil ile:
        className={[
          'transition',
          isMismatch ? 'opacity-60 cursor-not-allowed' : '',
          // güvence: hiçbir yerde pointer-events-none vermeyelim:
          'pointer-events-auto',
          className ?? '',
        ].join(' ')}
      >
        {children}
      </button>

      {isMismatch && (
        // ŞEFFAF OVERLAY → event her zaman burada yakalanır
        <span
          className="absolute inset-0 z-10 pointer-events-auto"
          role="presentation"
          aria-hidden="true"
          style={{ cursor: 'not-allowed' }}
          data-role-user={actualUserRole ?? ''}
          data-role-target={targetRole}
          data-role-mismatch="true"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showMessage();
          }}
          onAuxClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showMessage();
          }}
        />
      )}
    </span>
  );
}
