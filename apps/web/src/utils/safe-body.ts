/**
 * Safe body reader utility for handling different content types
 * Prevents "Unexpected end of JSON input" errors
 */

export async function readBody(req: Request | any): Promise<any> {
  const contentType = req.headers.get('content-type') || ''
  
  console.log('[SAFE-BODY] Processing content-type:', contentType)
  
  if (contentType.includes('application/json')) {
    try {
      const body = await req.json()
      console.log('[SAFE-BODY] JSON parsed successfully')
      return body
    } catch (error) {
      console.log('[SAFE-BODY] JSON parse error:', error)
      return { __json_error: true, error: 'Invalid JSON body' }
    }
  }
  
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await req.formData()
      const result = Object.fromEntries(formData.entries())
      console.log('[SAFE-BODY] FormData parsed successfully')
      return result
    } catch (error) {
      console.log('[SAFE-BODY] FormData parse error:', error)
      return { __form_error: true, error: 'Invalid FormData' }
    }
  }
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const text = await req.text()
      const result = Object.fromEntries(new URLSearchParams(text))
      console.log('[SAFE-BODY] URLEncoded parsed successfully')
      return result
    } catch (error) {
      console.log('[SAFE-BODY] URLEncoded parse error:', error)
      return { __urlencoded_error: true, error: 'Invalid URL encoded data' }
    }
  }
  
  // Empty or unsupported content type
  if (contentType === '') {
    const text = await req.text()
    if (text.trim() === '') {
      console.log('[SAFE-BODY] Empty body detected')
      return { __empty_body: true, error: 'Empty request body' }
    }
  }
  
  console.log('[SAFE-BODY] Unsupported content-type')
  return null
}

export function isBodyError(body: any): boolean {
  return !!(body?.__json_error || body?.__form_error || body?.__urlencoded_error || body?.__empty_body)
}

export function getBodyErrorMessage(body: any): string {
  if (body?.__json_error) return 'Geçersiz JSON formatı. Lütfen doğru JSON gönderin.'
  if (body?.__form_error) return 'Form verisi işlenemedi.'
  if (body?.__urlencoded_error) return 'URL encoded veri işlenemedi.'
  if (body?.__empty_body) return 'İstek gövdesi boş. Lütfen gerekli verileri gönderin.'
  return 'Bilinmeyen veri formatı hatası.'
}
