'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void
}

function ToastItem({ id, type, title, message, duration = 5000, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onRemove])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />
  }

  const colors = {
    success: 'from-green-500/20 to-emerald-500/20 border-green-500/20',
    error: 'from-red-500/20 to-pink-500/20 border-red-500/20',
    info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20'
  }

  return (
    <div className={`bg-gradient-to-r ${colors[type]} border backdrop-blur-sm rounded-xl p-4 shadow-lg transform transition-all duration-300 animate-in slide-in-from-right`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            {title}
          </p>
          {message && (
            <p className="mt-1 text-sm text-white/70">
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => onRemove(id)}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Global toast state
let toasts: Toast[] = []
let listeners: ((toasts: Toast[]) => void)[] = []

const notifyListeners = () => {
  listeners.forEach(listener => listener([...toasts]))
}

export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.push({ id, type: 'success', title, message, duration })
    notifyListeners()
    return id
  },
  error: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.push({ id, type: 'error', title, message, duration })
    notifyListeners()
    return id
  },
  info: (title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    toasts.push({ id, type: 'info', title, message, duration })
    notifyListeners()
    return id
  },
  remove: (id: string) => {
    toasts = toasts.filter(toast => toast.id !== id)
    notifyListeners()
  }
}

export function ToastContainer() {
  const [toastList, setToastList] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => {
      setToastList(newToasts)
    }
    
    listeners.push(listener)
    
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full pointer-events-none">
      {toastList.map(toastItem => (
        <div key={toastItem.id} className="pointer-events-auto">
          <ToastItem {...toastItem} onRemove={(id) => toast.remove(id)} />
        </div>
      ))}
    </div>
  )
}
