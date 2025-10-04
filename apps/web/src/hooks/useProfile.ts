import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadMyProfile, saveMyProfile } from '@/features/profile/api'

export function useProfile() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchProfile()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status, session])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const profileData = await loadMyProfile()
      setProfile(profileData)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const createTalentProfile = async (data: any) => {
    try {
      setError(null)
      
      const response = await saveMyProfile(data)
      setProfile(response)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to create profile')
      throw err
    }
  }

  const createAgencyProfile = async (data: any) => {
    try {
      setError(null)
      
      // For now, use the same saveMyProfile method
      // In the future, this should be separate agency profile handling
      const response = await saveMyProfile(data)
      setProfile(response)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to create profile')
      throw err
    }
  }

  const updateTalentProfile = async (data: any) => {
    try {
      setError(null)
      
      const response = await saveMyProfile(data)
      setProfile(response)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      throw err
    }
  }

  const updateAgencyProfile = async (data: any) => {
    try {
      setError(null)
      
      // For now, use the same saveMyProfile method
      // In the future, this should be separate agency profile handling
      const response = await saveMyProfile(data)
      setProfile(response)
      return response
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      throw err
    }
  }

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    createTalentProfile,
    createAgencyProfile,
    updateTalentProfile,
    updateAgencyProfile,
  }
}
