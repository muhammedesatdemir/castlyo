/**
 * API Health Check Utility
 * Always uses proxy for client-side requests to avoid CORS issues
 */

export async function checkApiHealth() {
  // Client tarafında daima proxy kullan
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser
    ? "/api/proxy/api/v1/health"
    : `${process.env.API_INTERNAL_URL || process.env.INTERNAL_API_URL || 'http://api:3001'}/api/v1/health`; // SSR'da direkt internal

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
  return "/api/proxy/api/v1/health";
}
