'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export function ApiHealthCheck() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [apiUrl, setApiUrl] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    // Get the complete API URL including base and prefix
    const baseUrl = process.env.WEB_API_BASE_URL || 'http://localhost:3001'
    const prefix = process.env.WEB_API_PREFIX || '/api/v1'
    const fullUrl = `${baseUrl}${prefix}`
    setApiUrl(fullUrl)

    // Test health endpoint
    const checkHealth = async () => {
      try {
        console.log('🔍 Testing API connection to:', `${fullUrl}/health`)
        const response = await api.get('/health')
        console.log('✅ API Health Check Response:', response.data)
        setStatus('connected')
        setErrorMessage('')
      } catch (error: any) {
        console.error('❌ API Health Check Failed:', error)
        setStatus('error')
        
        if (error.response) {
          setErrorMessage(`HTTP ${error.response.status}: ${error.response.statusText}`)
        } else if (error.request) {
          setErrorMessage('Network error: Could not reach API server')
        } else {
          setErrorMessage(`Error: ${error.message}`)
        }
      }
    }

    checkHealth()
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-yellow-600'
      case 'connected': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'loading': return 'Checking...'
      case 'connected': return 'Connected ✅'
      case 'error': return 'Failed ❌'
      default: return 'Unknown'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold text-sm mb-2">API Health Check</h3>
      <div className="text-xs space-y-1">
        <div>
          <span className="text-gray-600">API URL:</span>{' '}
          <span className="font-mono">{apiUrl}</span>
        </div>
        <div>
          <span className="text-gray-600">Status:</span>{' '}
          <span className={getStatusColor()}>{getStatusText()}</span>
        </div>
        {errorMessage && (
          <div className="text-red-600 text-xs mt-2">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
      </div>
    </div>
  )
}
