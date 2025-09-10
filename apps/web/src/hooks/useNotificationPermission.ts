'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'castlyo_notification_permission_asked'

export function useNotificationPermission() {
  const isClient = typeof window !== 'undefined'
  const isSupported = isClient && 'Notification' in window
  
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [hasAsked, setHasAsked] = useState(false)
  const [shouldShowPopup, setShouldShowPopup] = useState(false)

  useEffect(() => {
    // Check if browser supports notifications
    if (!isSupported) return

    // Get current permission status
    const currentPermission = Notification.permission
    setPermission(currentPermission)

    // Check if we've already asked the user
    const alreadyAsked = localStorage.getItem(STORAGE_KEY) === 'true'
    setHasAsked(alreadyAsked)

    // Show popup if permission hasn't been requested and we haven't asked before
    if (currentPermission === 'default' && !alreadyAsked) {
      // Wait a bit before showing to avoid immediate popup
      const timer = setTimeout(() => {
        setShouldShowPopup(true)
      }, 2000) // 2 seconds after page load

      return () => clearTimeout(timer)
    }
    }, [isSupported])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShouldShowPopup(false)
      
      // Mark as asked
      localStorage.setItem(STORAGE_KEY, 'true')
      setHasAsked(true)

      // Show test notification if granted
      if (result === 'granted') {
        new Notification('Castlyo', {
          body: 'Bildirimler başarıyla etkinleştirildi! 🎉',
          icon: '/logos/logo.png',
          badge: '/logos/logo.png',
          tag: 'welcome'
        })
      }

      return result
    } catch (error) {
      console.error('Notification permission error:', error)
      setShouldShowPopup(false)
      localStorage.setItem(STORAGE_KEY, 'true')
      setHasAsked(true)
      return 'denied'
    }
  }

  const dismissPopup = () => {
    setShouldShowPopup(false)
    localStorage.setItem(STORAGE_KEY, 'true')
    setHasAsked(true)
  }

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isSupported) {
      return new Notification(title, {
        icon: '/logos/logo.png',
        badge: '/logos/logo.png',
        ...options
      })
    }
    return null
  }

  return {
    permission,
    hasAsked,
    shouldShowPopup,
    requestPermission,
    dismissPopup,
    sendNotification,
    isSupported
  }
}
