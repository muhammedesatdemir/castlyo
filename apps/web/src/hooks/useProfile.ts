import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { profileApi } from '@/lib/api'

export function useProfile() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      const response = await profileApi.getMyProfile()
      setProfile(response.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch profile')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const createTalentProfile = async (data: any) => {
    try {
      setError(null)
      const response = await profileApi.createTalentProfile(data)
      setProfile(response.data)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile')
      throw err
    }
  }

  const createAgencyProfile = async (data: any) => {
    try {
      setError(null)
      const response = await profileApi.createAgencyProfile(data)
      setProfile(response.data)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create profile')
      throw err
    }
  }

  const updateTalentProfile = async (data: any) => {
    try {
      setError(null)
      const response = await profileApi.updateTalentProfile(session?.user?.id, data)
      setProfile(response.data)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile')
      throw err
    }
  }

  const updateAgencyProfile = async (data: any) => {
    try {
      setError(null)
      const response = await profileApi.updateAgencyProfile(session?.user?.id, data)
      setProfile(response.data)
      return response.data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile')
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
