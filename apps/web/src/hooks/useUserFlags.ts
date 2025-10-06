import { useState, useEffect } from 'react';
import { UsersMeFlags } from '../types/jobs';
import useMe from '@/hooks/useMe';

export function useUserFlags() {
  const [userFlags, setUserFlags] = useState<UsersMeFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { me } = useMe();
  useEffect(() => {
    if (!me) { setUserFlags(null); return; }
    setUserFlags(me as any);
  }, [me]);

  const fetchUserFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      setUserFlags(me as any ?? null);
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
