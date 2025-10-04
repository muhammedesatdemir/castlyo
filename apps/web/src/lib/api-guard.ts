import { getSession } from "next-auth/react";

let checkedOnce = false;

export async function guardApiUser() {
  if (checkedOnce) return;
  checkedOnce = true;

  const session = await getSession();
  const expected = session?.user?.email;
  if (!expected) return;

  try {
    const res = await fetch('/api/proxy/api/v1/users/me', { credentials: 'include' });
    if (!res.ok) return; // anonim ise bırakalım
    const me = await res.json().catch(() => null);
    if (me?.email && me.email !== expected) {
      // API'de başka kullanıcı açık -> uyarı ver
      throw new Error('Oturum uyuşmazlığı tespit edildi. Lütfen sayfayı yenileyin.');
    }
  } catch (error) {
    // Sessizce devam et, sadece uyuşmazlık durumunda hata fırlat
    if (error instanceof Error && error.message.includes('Oturum uyuşmazlığı')) {
      throw error;
    }
  }
}

// Reset guard for new sessions (call this on signIn/signOut)
export function resetApiGuard() {
  checkedOnce = false;
}
