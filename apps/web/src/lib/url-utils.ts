/**
 * Safely joins URL parts without duplicate slashes or prefixes
 * @param base The base URL (e.g., 'http://localhost:3001')
 * @param prefix The API prefix (e.g., '/api/v1')
 * @param path Optional additional path (e.g., '/health')
 * @returns Complete URL without duplicates
 */
export function joinUrl(base: string, prefix: string, path: string = ''): string {
  // Remove trailing slash from base
  const cleanBase = base.replace(/\/$/, '')
  
  // Ensure prefix starts with slash but doesn't end with one
  const cleanPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`
  const finalPrefix = cleanPrefix.replace(/\/$/, '')
  
  // Ensure path starts with slash if it exists, but doesn't end with one
  let cleanPath = ''
  if (path) {
    cleanPath = path.startsWith('/') ? path : `/${path}`
    cleanPath = cleanPath.replace(/\/$/, '')
  }
  
  return `${cleanBase}${finalPrefix}${cleanPath}`
}

/**
 * Creates a properly configured axios baseURL
 * @param baseUrl Base URL from environment 
 * @param prefix API prefix from environment
 * @returns Complete base URL for axios
 */
export function createApiBaseUrl(baseUrl?: string, prefix?: string): string {
  // For client-side, always use proxy
  const isServer = typeof window === 'undefined'
  const base = baseUrl || (isServer 
    ? process.env.API_INTERNAL_URL || process.env.INTERNAL_API_URL || 'http://api:3001'
    : '/api/proxy')
  const apiPrefix = prefix || (isServer ? '/api/v1' : '')
  
  return joinUrl(base, apiPrefix)
}
