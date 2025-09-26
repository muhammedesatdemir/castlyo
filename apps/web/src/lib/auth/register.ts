export async function registerUser(payload: {
  email: string;
  password: string;
  role: 'TALENT' | 'AGENCY';
  kvkkConsent: true;
  termsConsent: true;
  marketingConsent?: boolean;
  // Additional fields for talent/agency profiles
  [key: string]: any;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try { 
    data = await res.json(); 
  } catch { 
    // Boş gövde olabilir
  }

  if (!res.ok) {
    // Duplicate email için düzgün mesaj
    const msg =
      res.status === 409
        ? 'Bu e-posta zaten kayıtlı.'
        : data?.message || `Kayıt başarısız (HTTP ${res.status}).`;
    throw new Error(msg);
  }

  // Backend'in gerçek cevabı:
  // { success: true, user: {...}, accessToken, refreshToken }
  if (!data?.success || !data?.user?.id) {
    throw new Error('Beklenmeyen cevap formatı.');
  }

  // Bearer kullanıyorsan:
  if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);

  return data;
}
