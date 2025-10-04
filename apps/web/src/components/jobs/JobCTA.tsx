'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UsersMeFlags } from '../../types/jobs';
import Link from 'next/link';

interface JobCTAProps {
  jobId: string;
  userFlags: UsersMeFlags | null;
  isVisitor: boolean;
  onApply?: () => void;
}

export function JobCTA({ jobId, userFlags, isVisitor, onApply }: JobCTAProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = async () => {
    if (!userFlags?.canApplyJobs) return;
    
    try {
      setIsApplying(true);
      // TODO: Implement actual application logic
      console.log('Applying to job:', jobId);
      onApply?.();
    } catch (error) {
      console.error('Failed to apply to job:', error);
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
