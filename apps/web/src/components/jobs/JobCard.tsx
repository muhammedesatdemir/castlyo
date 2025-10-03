'use client';

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

interface JobCardProps {
  job: Job;
  userFlags: UsersMeFlags | null;
  isVisitor: boolean;
}

export function JobCard({ job, userFlags, isVisitor }: JobCardProps) {
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {job.isFeatured && (
                <Badge className="bg-yellow-100 text-yellow-800">
                  Öne Çıkan
                </Badge>
              )}
              {job.isUrgent && (
                <Badge variant="destructive">
                  Acil
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight mb-2">
              <Link 
                href={`/jobs/${job.id}`}
                className="hover:text-brand-primary transition-colors"
              >
                {job.title}
              </Link>
            </CardTitle>
            <div className="text-sm text-gray-600">
              {job.agency?.companyName}
              {job.agency?.isVerified && (
                <Badge className="ml-2 text-xs bg-green-100 text-green-800">
                  Doğrulanmış
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
          {job.description.substring(0, 150)}...
        </p>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{job.city || job.location || 'Konum belirtilmemiş'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{job.expiresAt ? getTimeLeft(job.expiresAt) : 'Tarih belirtilmemiş'}</span>
          </div>
          
          {job.budgetRange && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>{job.budgetRange}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
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
            <Link href={`/jobs/${job.id}`}>
              <Button size="sm" variant="outline">
                Detayları Gör
              </Button>
            </Link>
            <JobCTA 
              jobId={job.id}
              userFlags={userFlags}
              isVisitor={isVisitor}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
