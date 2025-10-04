import { useEffect, useState } from 'react';
import type { Job, AgencyPublic } from '../types/job';

export function useJob(id?: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/proxy/api/v1/jobs/${id}`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Detay alınamadı (${res.status})`);
        }
        const data: Job = await res.json();

        // Ajans bilgisi yoksa ayrı uçtan tamamla (herkese açık profil)
        if (!data.agency && data.agency_id) {
          try {
            const ap = await fetch(`/api/proxy/api/v1/profiles/agency/${data.agency_id}`);
            if (ap.ok) {
              const agency: AgencyPublic = await ap.json();
              (data as any).agency = {
                id: agency.id,
                name: agency.name,
                city: agency.city ?? null,
                verified: (agency as any).verified ?? null,
                website: agency.website ?? null,
              };
            }
          } catch { /* yoksay */ }
        }
        if (alive) setJob(data);
      } catch (e: any) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [id]);

  return { job, loading, error, setJob };
}
