export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  
  // 404'u "profil yok" olarak ele al - hata fırlatma
  if (res.status === 404) {
    return null as T;
  }
  
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || `Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  
  return res.json();
}

// SWR için özel fetcher - 404'te retry yapmaz
export async function swrFetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  
  // 404'u "profil yok" olarak ele al - hata fırlatma
  if (res.status === 404) {
    return null as T;
  }
  
  if (!res.ok) {
    const text = await res.text();
    const err: any = new Error(text || `Request failed: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }
  
  return res.json();
}
