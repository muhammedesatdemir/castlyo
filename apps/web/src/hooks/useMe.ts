'use client';
import { useQuery } from '@tanstack/react-query';

export interface MeData {
  id: string;
  email: string;
  role: 'AGENCY' | 'TALENT' | 'ADMIN';
  first_name?: string;
  last_name?: string;
  phone?: string;
  talent_profile_id?: string;
  agency_profile_id?: string;
  canApplyJobs?: boolean;
  canPostJobs?: boolean;
  isTalentProfileComplete?: boolean;
  isAgencyProfileComplete?: boolean;
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<MeData> => {
      const res = await fetch('/api/proxy/api/v1/users/me', { 
        credentials: 'include' 
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to load user data');
      }
      
      return res.json();
    },
    staleTime: 0, // Her zaman fresh data al
    retry: (failureCount, error) => {
      // 401 durumunda retry yapma
      if (error.message === 'Unauthorized') {
        return false;
      }
      return failureCount < 3;
    }
  });
}