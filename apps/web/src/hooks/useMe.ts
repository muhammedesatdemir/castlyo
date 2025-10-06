"use client";

import useSWR from "swr";
import { apiFetch, __SESSION_KILLED__ } from "@/lib/api";

export type Me = {
  id: string;
  email: string;
  role: string;
  // ihtiyaca göre diğer alanlar...
};

function useMeImpl(options?: {
  revalidateOnFocus?: boolean;
  shouldRetryOnError?: (err: any) => boolean;
}) {
  const key = __SESSION_KILLED__ ? null : "/api/proxy/api/v1/users/me";

  const fetcher = async (_url: string) => {
    const data = await apiFetch<Me>('/users/me' as any).catch((e) => {
      // apiFetch already throws with status; rethrow for SWR handler
      throw e;
    });
    return data as Me;
  };

  const { data, error, isLoading, mutate } = useSWR<Me>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: (err: any) => {
      const s = err?.status ?? err?.response?.status;
      if (__SESSION_KILLED__) return false;
      return !(s === 401 || s === 404);
    },
    ...options,
  });

  // Geri uyumluluk: hem eski (data/isLoading) hem yeni (me/meLoading) alanları döndür.
  return {
    // yeni isimlendirme
    me: data ?? null,
    meError: error ?? null,
    meLoading: !!key && isLoading,
    mutateMe: mutate,
    // eski isimlendirme (back-compat)
    data: data ?? null,
    error: error ?? null,
    isLoading: !!key && isLoading,
    mutate,
  };
}

// Hem default, hem named export
export default useMeImpl;
export const useMe = useMeImpl;