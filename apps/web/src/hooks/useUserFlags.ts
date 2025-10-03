import { useState, useEffect } from 'react';
import { UsersMeFlags } from '../types/jobs';

export function useUserFlags() {
  const [userFlags, setUserFlags] = useState<UsersMeFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserFlags();
  }, []);

  const fetchUserFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/proxy/api/v1/users/me', {
        credentials: 'include',
      });

      if (response.status === 401) {
        // User not authenticated - this is normal for visitors
        setUserFlags(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserFlags(data);
    } catch (err) {
      console.error('Failed to fetch user flags:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      setUserFlags(null);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchUserFlags();
  };

  return {
    userFlags,
    loading,
    error,
    refetch,
    isVisitor: !userFlags,
    isTalent: userFlags?.role === 'TALENT',
    isAgency: userFlags?.role === 'AGENCY',
    canApplyJobs: userFlags?.canApplyJobs ?? false,
    canPostJobs: userFlags?.canPostJobs ?? false,
    isTalentProfileComplete: userFlags?.isTalentProfileComplete ?? false,
    isAgencyProfileComplete: userFlags?.isAgencyProfileComplete ?? false,
  };
}
