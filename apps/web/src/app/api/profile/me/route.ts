import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

async function smartParse(res: Response) {
  if (res.status === 204 || res.status === 205) return { json: true, body: null };
  if (isJson(res)) return { json: true, body: await res.json() };
  return { json: false, body: await res.text().catch(() => '') };
}

export async function GET() {
  // STEP 1: Session
  let session: any;
  try {
    session = await getServerSession(authOptions);
  } catch (e: any) {
    console.error('[profile/me] SESSION_CRASH', e);
    return NextResponse.json(
      { error: 'SESSION_CRASH', detail: String(e?.message || e) },
      { status: 500 },
    );
  }
  if (!session?.access_token) {
    return NextResponse.json({ error: 'NO_ACCESS_TOKEN' }, { status: 401 });
  }

  // STEP 2: ENV
  const API = process.env.NEXT_PUBLIC_API_URL;
  if (!API) {
    return NextResponse.json({ error: 'MISSING_API_URL' }, { status: 500 });
  }
  const headers = { Authorization: `Bearer ${session.access_token}`, Accept: 'application/json' };

  // STEP 3: users/me
  let user;
  try {
    const uRes = await fetch(`${API}/users/me`, { headers, cache: 'no-store', next: { revalidate: 0 } });
    const uParsed = await smartParse(uRes);
    if (!uRes.ok) {
      return NextResponse.json(
        {
          error: uParsed.json ? (uParsed.body?.error ?? 'USERS_ME_ERROR') : 'USERS_ME_NON_JSON',
          where: 'users/me',
          status: uRes.status,
          detail: uParsed.json ? uParsed.body : String(uParsed.body).slice(0, 2000),
        },
        { status: uRes.status },
      );
    }
    user = uParsed.body;
  } catch (e: any) {
    console.error('[profile/me] USERS_ME_FETCH_CRASH', e);
    return NextResponse.json(
      { error: 'USERS_ME_FETCH_CRASH', detail: String(e?.message || e) },
      { status: 502 },
    );
  }

  // STEP 4: profiles/me (opsiyonel)
  let profile: any = null;
  try {
    const pRes = await fetch(`${API}/profiles/me`, { headers, cache: 'no-store', next: { revalidate: 0 } });
    const pParsed = await smartParse(pRes);
    if (pRes.ok && pParsed.json) {
      profile = pParsed.body;
    } else if (pRes.status === 404) {
      profile = null;
    } else if (!pParsed.json) {
      return NextResponse.json(
        { error: 'PROFILES_ME_NON_JSON', where: 'profiles/me', status: pRes.status, detail: String(pParsed.body).slice(0, 2000) },
        { status: 502 },
      );
    } else {
      return NextResponse.json(
        { error: 'PROFILES_ME_ERROR', where: 'profiles/me', status: pRes.status, detail: pParsed.body },
        { status: pRes.status },
      );
    }
  } catch (e: any) {
    // Profil çağrısı çökerse bile kullanıcıyı döndürelim
    console.warn('[profile/me] PROFILES_ME_FETCH_CRASH', e);
    profile = null;
  }

  return NextResponse.json({ user, profile });
}