/**
 * API Health Check Utility
 * Always uses proxy for client-side requests to avoid CORS issues
 */

export async function checkApiHealth() {
  // Client tarafında daima proxy kullan
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? "/api/proxy/health"  // Proxy üzerinden health endpoint'e git
    : `${process.env.INTERNAL_API_URL}/api/v1/health`; // SSR'da direkt internal

  try {
    const res = await fetch(url, { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {
      throw new Error(`HEALTH_${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

export function getApiDisplayUrl() {
  // UI'de gösterilecek URL - proxy'yi göster
  return "/api/proxy/health";
}
