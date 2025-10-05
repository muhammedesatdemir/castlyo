'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UsersMeFlags } from '../../types/jobs';
import Link from 'next/link';
import { toast } from '@/components/ui/toast';

interface JobCTAProps {
  jobId: string;
  userFlags: UsersMeFlags | null;
  isVisitor: boolean;
  onApply?: () => void;
  onApplicationSuccess?: () => void;
}

export function JobCTA({ jobId, userFlags, isVisitor, onApply, onApplicationSuccess }: JobCTAProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!userFlags?.canApplyJobs) return;
    
    try {
      setIsApplying(true);
      console.log('Applying to job:', jobId);
      
      const response = await fetch('/api/proxy/api/v1/jobs/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          jobId,
          coverLetter: 'Bu işe başvurmak istiyorum.',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({} as any));
        const msg = (errJson?.message as string) || 'İşlem başarısız';
        const status = response.status;

        if (status === 409) {
          toast.info('Zaten başvurmuşsunuz', 'Bu ilana daha önce başvurdunuz.');
          return;
        }
        if (status === 404 || status === 410) {
          toast.error('İlan kapalı veya bulunamadı', 'Başvuruya açık değil.');
          return;
        }
        if (status === 401) {
          toast.error('Giriş gerekli', 'Lütfen oturum açın.');
          return;
        }
        if (status === 403) {
          toast.error('Yetkiniz yok', 'Bu işlem için izniniz bulunmuyor.');
          return;
        }
        if (status === 400 || status === 422) {
          toast.error('Başvuru alınamadı', msg || 'Profilini kontrol et (eksik/uygunsuz veri).');
          return;
        }

        toast.error('Başvuru alınamadı', msg);
        return;
      }

      const result = await response.json();
      console.log('Application successful:', result);
      
      toast.success('Başvurunuz alındı', 'Başvurunuz başarıyla gönderildi!');
      onApply?.();
      onApplicationSuccess?.();
      
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Başvuru alınamadı', 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsApplying(false);
    }
  };

  // Visitor - show login modal trigger
  if (isVisitor) {
    return (
      <Link href={`/login?redirect=/jobs/${jobId}`}>
        <Button 
          size="sm" 
          disabled
          className="bg-[#F6E6C3]/20 text-[#F6E6C3] border-[#F6E6C3]/40"
        >
          Giriş Yap
        </Button>
      </Link>
    );
  }

  // Agency - don't show apply button
  if (userFlags?.role === 'AGENCY') {
    return null;
  }

  // Talent with incomplete profile
  if (userFlags?.role === 'TALENT' && !userFlags?.isTalentProfileComplete) {
    return (
      <Link href="/onboarding/talent">
        <Button 
          size="sm" 
          variant="outline"
          className="border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10"
        >
          Profili Tamamla
        </Button>
      </Link>
    );
  }

  // Talent with complete profile
  if (userFlags?.canApplyJobs) {
    return (
      <Button 
        size="sm" 
        onClick={handleApply}
        disabled={isApplying}
        className="bg-[#962901] text-[#F6E6C3] hover:opacity-90 disabled:opacity-50"
      >
        {isApplying ? 'Başvuruluyor...' : 'Başvur'}
      </Button>
    );
  }

  // Fallback
  return (
    <Button 
      size="sm" 
      disabled
      className="bg-[#F6E6C3]/20 text-[#F6E6C3] border-[#F6E6C3]/40"
    >
      Başvur
    </Button>
  );
}
