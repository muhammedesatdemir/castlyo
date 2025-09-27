'use client'

import { useState, useEffect, useRef } from 'react'
import { checkApiHealth, getApiDisplayUrl } from '@/lib/health'

export function ApiHealthCheck() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
  const [apiUrl, setApiUrl] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const reloadedOnce = useRef(false)

  useEffect(() => {
    setApiUrl(getApiDisplayUrl())

    // Test health endpoint
    const checkHealth = async () => {
      try {
        console.log('🔍 Testing API connection via proxy')
        const response = await checkApiHealth()
        console.log('✅ API Health Check Response:', response)
        setStatus('connected')
        setErrorMessage('')
      } catch (error: any) {
        console.error('❌ API Health Check Failed:', error)
        setStatus('error')
        
        // Sonsuz reload'ı önle
        if (!reloadedOnce.current) {
          reloadedOnce.current = true
          // İsteğe bağlı: setTimeout(() => window.location.reload(), 5000)
        }
        
        setErrorMessage(error.message || 'Health check failed')
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
