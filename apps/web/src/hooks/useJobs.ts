import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Job, JobsResponse, JobsQueryParams } from '../types/jobs';

export function useJobs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<JobsResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse current search params - memoized to prevent infinite loops
  const currentParams: JobsQueryParams = useMemo(() => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '12'),
    q: searchParams.get('q') || undefined,
    city: searchParams.get('city') || undefined,
    jobType: searchParams.get('jobType') || undefined,
    status: searchParams.get('status') || undefined,
  }), [searchParams]);

  const fetchJobs = useCallback(async (params: JobsQueryParams = currentParams) => {
    let cancelled = false;
    
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.set('page', params.page.toString());
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.q) queryParams.set('q', params.q);
      if (params.city) queryParams.set('city', params.city);
      if (params.jobType) queryParams.set('jobType', params.jobType);
      if (params.status) queryParams.set('status', params.status);

      const url = `/api/proxy/api/v1/jobs?${queryParams.toString()}`;
      console.log('Fetching jobs from:', url);
      
      const response = await fetch(url, { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Jobs ${response.status} ${response.statusText} ${text}`);
      }

      const data: JobsResponse = await response.json();
      
      // Safe data adapter with normalization
      const rawJobs = Array.isArray(data) ? data : data?.data ?? [];
      const jobsArray = rawJobs.map((job: any) => ({
        ...job,
        // Normalize application count to number
        applicationCount: Number(
          job.applicationsCount ?? 
          job.applications_count ?? 
          job.currentApplications ?? 
          job.current_applications ?? 
          0
        ),
        // Normalize views to number
        views: Number(job.views ?? 0),
        // Normalize other numeric fields
        salary_min: job.salary_min ? Number(job.salary_min) : null,
        salary_max: job.salary_max ? Number(job.salary_max) : null,
        ageMin: job.ageMin ? Number(job.ageMin) : null,
        ageMax: job.ageMax ? Number(job.ageMax) : null,
        maxApplications: job.maxApplications ? Number(job.maxApplications) : null,
      }));
      const metaData = Array.isArray(data) ? null : data?.meta ?? null;
      
      if (!cancelled) {
        console.log('Jobs fetched successfully:', { data: jobsArray, meta: metaData });
        setJobs(jobsArray);
        setMeta(metaData);
      }
    } catch (err) {
      if (!cancelled) {
        console.error('Failed to fetch jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
        setJobs([]);
        setMeta(null);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
    
    return () => { cancelled = true; };
  }, [currentParams]);

  const updateParams = useCallback((newParams: Partial<JobsQueryParams>) => {
    const params = new URLSearchParams(searchParams);
    
    // Update parameters
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when changing filters (except page itself)
    if (newParams.page === undefined && Object.keys(newParams).some(k => k !== 'page')) {
      params.set('page', '1');
    }

    router.push(`/jobs?${params.toString()}`);
  }, [router, searchParams]);

  const clearFilters = useCallback(() => {
    router.push('/jobs');
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query string
        const queryParams = new URLSearchParams();
        if (currentParams.page) queryParams.set('page', currentParams.page.toString());
        if (currentParams.limit) queryParams.set('limit', currentParams.limit.toString());
        if (currentParams.q) queryParams.set('q', currentParams.q);
        if (currentParams.city) queryParams.set('city', currentParams.city);
        if (currentParams.jobType) queryParams.set('jobType', currentParams.jobType);
        if (currentParams.status) queryParams.set('status', currentParams.status);

        const url = `/api/proxy/api/v1/jobs?${queryParams.toString()}`;
        console.log('Fetching jobs from:', url);
        
        const response = await fetch(url, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(`Jobs ${response.status} ${response.statusText} ${text}`);
        }

        const data: JobsResponse = await response.json();
        
        // Safe data adapter with normalization
        const rawJobs = Array.isArray(data) ? data : data?.data ?? [];
        const jobsArray = rawJobs.map((job: any) => ({
          ...job,
          // Normalize application count to number
          applicationCount: Number(
            job.applicationsCount ?? 
            job.applications_count ?? 
            job.currentApplications ?? 
            job.current_applications ?? 
            0
          ),
          // Normalize views to number
          views: Number(job.views ?? 0),
          // Normalize other numeric fields
          salary_min: job.salary_min ? Number(job.salary_min) : null,
          salary_max: job.salary_max ? Number(job.salary_max) : null,
          ageMin: job.ageMin ? Number(job.ageMin) : null,
          ageMax: job.ageMax ? Number(job.ageMax) : null,
          maxApplications: job.maxApplications ? Number(job.maxApplications) : null,
        }));
        const metaData = Array.isArray(data) ? null : data?.meta ?? null;
        
        if (!cancelled) {
          console.log('Jobs fetched successfully:', { data: jobsArray, meta: metaData });
          setJobs(jobsArray);
          setMeta(metaData);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch jobs:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
          setJobs([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => { cancelled = true; };
  }, [currentParams]);

  return {
    jobs,
    meta,
    loading,
    error,
    currentParams,
    updateParams,
    clearFilters,
    refetch: () => fetchJobs(),
  };
}
