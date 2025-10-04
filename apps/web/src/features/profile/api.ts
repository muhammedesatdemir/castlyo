import { guardApiUser } from '@/lib/api-guard';

type UserMe = { id: string; email: string; talent_profile_id?: string | null };
type TalentPayload = Record<string, any>;

export async function loadMyProfile() {
  await guardApiUser(); // emniyet kemeri
  const me: UserMe = await fetch('/api/proxy/api/v1/users/me', { credentials: 'include' }).then(r => r.json());
  if (!me?.id) throw new Error('Kullanıcı bulunamadı');

  if (me.talent_profile_id) {
    const p = await fetch(`/api/proxy/api/v1/talents/${me.talent_profile_id}`, { credentials: 'include' });
    if (!p.ok) return null;
    return await p.json();
  }
  return null;
}

export async function saveMyProfile(data: TalentPayload) {
  await guardApiUser(); // emniyet kemeri
  
  // Check if profile exists by trying to GET it
  const resCheck = await fetch('/api/proxy/api/v1/profiles/talent/me', {
    method: 'GET',
    credentials: 'include',
  });

  const hasProfile = resCheck.ok; // 200 → var

  const url = hasProfile
    ? '/api/proxy/api/v1/profiles/talent/me'
    : '/api/proxy/api/v1/profiles/talent';

  const method = hasProfile ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Profile save failed (${res.status}) ${text}`);
  }
  return res.json();
}
