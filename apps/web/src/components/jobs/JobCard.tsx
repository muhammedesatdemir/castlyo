'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye,
  Users,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Job, UsersMeFlags } from '../../types/jobs';
import { JobCTA } from './JobCTA';
import JobDetailsModal from './JobDetailsModal';

interface JobCardProps {
  job: Job;
  userFlags: UsersMeFlags | null;
  isVisitor: boolean;
  currentUser?: { id: string; role: 'AGENCY' | 'TALENT' | 'ADMIN'; agencyProfileId?: string | null };
}

export function JobCard({ job, userFlags, isVisitor, currentUser }: JobCardProps) {
  const [open, setOpen] = useState(false);

  const getTimeLeft = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Süresi dolmuş';
    if (diffDays === 0) return 'Bugün sona eriyor';
    if (diffDays === 1) return 'Yarın sona eriyor';
    return `${diffDays} gün kaldı`;
  };

  // yardımcılar
  const fmtK = (n?: number | null) =>
    n == null ? '' : (n >= 1000 ? `${Math.round(n / 100) / 10}k` : `${n}`);

  const currencySign = (c?: string | null) =>
    c === 'USD' ? '$' : c === 'EUR' ? '€' : '₺';

  // Fiyat: salary_min/max varsa onları göster, yoksa budget_range'a düş
  const price =
    job.salary_min != null && job.salary_max != null
      ? `${currencySign(job.currency)}${fmtK(job.salary_min)}-${fmtK(job.salary_max)}`
      : (job.budgetRange && job.budgetRange.trim().length > 0)
        ? job.budgetRange
        : '—';

  // Tarih: application_deadline varsa "X gün kaldı", yoksa "Tarih belirtilmemiş"
  const daysLeft = job.application_deadline
    ? (() => {
        const d = new Date(job.application_deadline);
        const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? `${diff} gün kaldı` : 'Süre doldu';
      })()
    : 'Tarih belirtilmemiş';

  // Detay herkese açık
  const canViewDetails = true;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow bg-[#0B0F1A] border-[#F6E6C3]/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {job.isFeatured && (
                <Badge className="bg-[#F6E6C3]/20 text-[#F6E6C3] border-[#F6E6C3]/40">
                  Öne Çıkan
                </Badge>
              )}
              {job.isUrgent && (
                <Badge className="bg-red-500/20 text-red-300 border-red-500/40">
                  Acil
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight mb-2 text-[#F6E6C3]">
              {job.title}
            </CardTitle>
            {/* AJANS ADI */}
            <div className="text-sm text-[#F6E6C3]/80">
              {job.agency?.companyName || (job.agency as any)?.name || 'Ajans'}
              {job.agency?.isVerified && (
                <Badge className="ml-2 text-xs bg-green-500/20 text-green-300 border-green-500/40">
                  Doğrulanmış
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-[#F6E6C3]/90 text-sm mb-4 line-clamp-3">
          {job.description.substring(0, 150)}...
        </p>

        <div className="space-y-2 text-sm text-[#F6E6C3]/80 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F6E6C3]/60" />
            <span>{job.city ?? '—'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#F6E6C3]/60" />
            <span>{daysLeft}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#F6E6C3]/60" />
            <span>{price}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-[#F6E6C3]/60">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{job.views || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{job.applicationCount || 0} başvuru</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-[#F6E6C3]/40 text-[#F6E6C3] hover:bg-[#F6E6C3]/10"
                onClick={() => setOpen(true)}
                disabled={!canViewDetails}
                title="Detayları görüntüle"
              >
                Detayları Gör
              </Button>
            <JobCTA 
              jobId={job.id}
              userFlags={userFlags}
              isVisitor={isVisitor}
            />
          </div>
        </div>
      </CardContent>
    </Card>

    {open && (
      <JobDetailsModal
        jobId={job.id}
        onClose={() => setOpen(false)}
        currentUser={currentUser}
        onSaved={() => setOpen(false)}
      />
    )}
  </>
  );
}
