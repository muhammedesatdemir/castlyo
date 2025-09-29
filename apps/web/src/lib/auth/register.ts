import { api } from '../api';

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
  try {
    const { data, status } = await api.post("/api/v1/auth/register", payload);

    if (status === 201 || status === 200 || data?.success) {
      // Bearer kullanıyorsan:
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      return data;
    }
    
    throw new Error(data?.message || "REGISTER_FAILED");
  } catch (err: any) {
    // Fallback: exists
    try {
      const { data } = await api.get(`/api/v1/auth/exists`, { params: { email: payload.email } });
      if (data?.exists) {
        throw new Error("Bu e-posta zaten kayıtlı.");
      }
    } catch {}
    
    const msg = err?.response?.status === 409
      ? 'Bu e-posta zaten kayıtlı.'
      : err?.response?.data?.message || err?.message || `Kayıt başarısız.`;
    throw new Error(msg);
  }
}
