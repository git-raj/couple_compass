'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: number
    name: string
    email: string
  }
}

interface ProfileData {
  name: string
  pronouns: string
  birthdate: string
  timezone: string
  relationshipStatus: string
  partnerName: string
  anniversaryDate: string
}

export default function ProfileSettingsModal({ isOpen, onClose, user }: ProfileSettingsModalProps) {
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user.name || '',
    pronouns: '',
    birthdate: '',
    timezone: 'UTC',
    relationshipStatus: '',
    partnerName: '',
    anniversaryDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // API helper
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  }

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  // Load current profile data
  useEffect(() => {
    if (isOpen) {
      loadProfileData()
    }
  }, [isOpen])

  const loadProfileData = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData({
          name: data.name || user.name || '',
          pronouns: data.pronouns || '',
          birthdate: data.birthdate || '',
          timezone: data.timezone || 'UTC',
          relationshipStatus: data.relationship_status || '',
          partnerName: data.partner_name || '',
          anniversaryDate: data.anniversary_date || '',
        })
      } else {
        setError('Failed to load profile data')
      }
    } catch (err) {
      setError('Failed to load profile data')
      console.error('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update localStorage with new user info
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        setSuccess(true)
        
        // Close modal after a brief success message
        setTimeout(() => {
          onClose()
          // Refresh the page to update the UI
          window.location.reload()
        }, 1500)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Profile update failed')
      }
    } catch (err) {
      setError('Profile update failed')
      console.error('Profile update error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading profile data...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
                  Profile updated successfully! Refreshing...
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={profileData.name}
                    onChange={handleChange}
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700 mb-2">
                    Pronouns (Optional)
                  </label>
                  <select
                    id="pronouns"
                    name="pronouns"
                    value={profileData.pronouns}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select pronouns</option>
                    <option value="she/her">She/Her</option>
                    <option value="he/him">He/Him</option>
                    <option value="they/them">They/Them</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Date (Optional)
                  </label>
                  <Input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    value={profileData.birthdate}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={profileData.timezone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>

              {/* Relationship Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Relationship Information</h3>
                
                <div>
                  <label htmlFor="relationshipStatus" className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship Status
                  </label>
                  <select
                    id="relationshipStatus"
                    name="relationshipStatus"
                    value={profileData.relationshipStatus}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select status</option>
                    <option value="single">Single (looking for guidance)</option>
                    <option value="dating">Dating</option>
                    <option value="engaged">Engaged</option>
                    <option value="married">Married</option>
                    <option value="partnership">Long-term Partnership</option>
                  </select>
                </div>

                {profileData.relationshipStatus && profileData.relationshipStatus !== 'single' && (
                  <>
                    <div>
                      <label htmlFor="partnerName" className="block text-sm font-medium text-gray-700 mb-2">
                        Partner's Name (Optional)
                      </label>
                      <Input
                        id="partnerName"
                        name="partnerName"
                        type="text"
                        placeholder="Your partner's name"
                        value={profileData.partnerName}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label htmlFor="anniversaryDate" className="block text-sm font-medium text-gray-700 mb-2">
                        Anniversary Date (Optional)
                      </label>
                      <Input
                        id="anniversaryDate"
                        name="anniversaryDate"
                        type="date"
                        value={profileData.anniversaryDate}
                        onChange={handleChange}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
