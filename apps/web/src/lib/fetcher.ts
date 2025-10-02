export async function fetcher<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 404) return null as T;  // 404'u sessizce boş sonuç olarak ele al
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
