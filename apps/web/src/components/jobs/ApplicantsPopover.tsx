'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { ApplicantDetailsDialog } from './ApplicantDetailsDialog';

type ApplicantRow = {
  applicationId: string;
  talentId: string | null;
  fullName: string;
  createdAt?: string | null;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: 'include' });
  // status log
  console.debug('[Applicants] fetch', url, '→', res.status);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err: any = new Error('Fetch failed');
    err.status = res.status;
    err.body = text;
    throw err;
  }
  // backend bazen [] bazen {data: []} döndüğü için json + normalize üstte yapılacak
  return res.json();
};

export function ApplicantsPopover({
  jobId,
  count,
  enabled,
}: {
  jobId: string;
  count: number;
  enabled: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  if (!enabled) {
    return <span className="text-muted-foreground">{count} başvuru</span>;
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="link" className="p-0 h-auto underline underline-offset-4" onClick={() => setOpen(v => !v)}>
        {count} başvuru
      </Button>
      {open && (
        <div className="fixed z-[60] right-4 md:right-auto md:absolute md:right-0 mt-2 w-96 md:w-[28rem] rounded-md border bg-popover text-popover-foreground shadow-xl p-0" style={{ maxHeight: '18rem' }}>
          <ApplicantsList jobId={jobId} />
        </div>
      )}
    </div>
  );
}

function ApplicantsList({ jobId }: { jobId: string }) {
  // URL — proxy'nizde ikisi de 200 veriyor; tutarlılık için api/v1'li sürümü kullanalım
  const url = `/api/proxy/api/v1/jobs/${jobId}/applications`;
  console.debug('[Applicants] jobId:', jobId, 'url:', url);

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
  });

  // Normalize: [] veya { data: [] }
  const raw = React.useMemo(() => {
    if (!data) return [];
    return Array.isArray(data) ? data : (data.data ?? []);
  }, [data]);

  // Map: backend alan adlarını UI modeline çevir
  const applicants: ApplicantRow[] = React.useMemo(
    () =>
      raw.map((x: any) => ({
        applicationId: x.id ?? x.applicationId,
        talentId: x.talentProfileId ?? x.talentId ?? null,
        fullName:
          x.fullName ||
          x.talentDisplayName ||
          [x.talentFirstName, x.talentLastName].filter(Boolean).join(' ') ||
          'İsimsiz Başvuru',
        createdAt: x.createdAt ?? x.reviewedAt ?? null,
      })),
    [raw]
  );

  // Teşhis logu
  React.useEffect(() => {
    console.debug('[Applicants] raw:', raw);
    console.debug('[Applicants] mapped:', applicants);
    if (error) console.error('[Applicants] error:', (error as any)?.status, (error as any)?.body);
  }, [raw, applicants, error]);

  if (isLoading) {
    return (
      <div className="p-3 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-6 rounded bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    const status = (error as any)?.status;
    if (status === 403) {
      return <div className="p-3 text-sm text-red-500">Bu ilana erişim yetkiniz yok.</div>;
    }
    return (
      <div className="p-3 text-sm text-red-500">
        Başvurular yüklenemedi. {(error as any)?.status ? `(${(error as any).status})` : ''}
      </div>
    );
  }

  if (applicants.length === 0) {
    return <div className="p-3 text-sm text-muted-foreground">Henüz başvuru yok.</div>;
  }

  return (
    <ul className="max-h-72 overflow-auto divide-y">
      {applicants.map((a) => (
        <li key={a.applicationId} className="p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{a.fullName}</div>
            {a.createdAt && (
              <div className="text-[11px] text-muted-foreground">
                {new Date(a.createdAt).toLocaleString()}
              </div>
            )}
          </div>
          {a.talentId ? (
            <ApplicantDetailsDialog
              jobId={jobId}
              applicationId={a.applicationId}
              trigger={<Button size="sm" variant="outline">Profili görüntüle</Button>}
            />
          ) : (
            <span className="text-xs text-muted-foreground">Profil yok</span>
          )}
        </li>
      ))}
    </ul>
  );
}
