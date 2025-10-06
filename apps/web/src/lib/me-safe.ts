"use client";
import { __SESSION_KILLED__ } from "@/lib/api";

export async function getMeSafe<T = any>(): Promise<T | null> {
  if (__SESSION_KILLED__) return null;
  try {
    const res = await fetch("/api/proxy/api/v1/users/me", { credentials: 'include' });
    if (!res.ok) {
      const s = res.status;
      if (s === 401 || s === 404) return null;
      const err: any = new Error('HTTP_ERROR');
      err.status = s;
      throw err;
    }
    return await res.json();
  } catch (e: any) {
    const s = e?.status ?? e?.response?.status;
    if (s === 401 || s === 404) return null;
    throw e;
  }
}


