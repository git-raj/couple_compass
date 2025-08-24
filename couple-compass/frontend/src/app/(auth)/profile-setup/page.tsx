'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ProfileSetupPage() {
  const [formData, setFormData] = useState({
    pronouns: '',
    birthdate: '',
    timezone: 'UTC',
    relationshipStatus: '',
    partnerName: '',
    anniversaryDate: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setError('Authentication required. Please log in again.')
        window.location.href = '/login'
        return
      }

      // Call the backend API to update profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Profile update failed')
      }

      // Update local storage with the updated user info
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect to dashboard after completing profile setup
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile setup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700 mb-2">
                Pronouns (Optional)
              </label>
              <select
                id="pronouns"
                name="pronouns"
                value={formData.pronouns}
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
                value={formData.birthdate}
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
                value={formData.timezone}
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
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="relationshipStatus" className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Status
              </label>
              <select
                id="relationshipStatus"
                name="relationshipStatus"
                value={formData.relationshipStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select status</option>
                <option value="single">Single (looking for guidance)</option>
                <option value="dating">Dating</option>
                <option value="engaged">Engaged</option>
                <option value="married">Married</option>
                <option value="partnership">Long-term Partnership</option>
              </select>
            </div>

            {formData.relationshipStatus && formData.relationshipStatus !== 'single' && (
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
                    value={formData.partnerName}
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
                    value={formData.anniversaryDate}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Perfect! Your profile is almost ready
              </h3>
              <p className="text-gray-600">
                Review your information and complete your profile setup.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div><strong>Pronouns:</strong> {formData.pronouns || 'Not specified'}</div>
              <div><strong>Birth Date:</strong> {formData.birthdate || 'Not specified'}</div>
              <div><strong>Timezone:</strong> {formData.timezone}</div>
              <div><strong>Relationship Status:</strong> {formData.relationshipStatus}</div>
              {formData.partnerName && (
                <div><strong>Partner:</strong> {formData.partnerName}</div>
              )}
              {formData.anniversaryDate && (
                <div><strong>Anniversary:</strong> {formData.anniversaryDate}</div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🧭</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {step === 1 ? 'Tell us about yourself' : 
             step === 2 ? 'Your relationship' : 
             'Complete your profile'}
          </h2>
          <p className="mt-2 text-gray-600">
            Step {step} of 3
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {renderStep()}

          <div className="flex space-x-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="w-full"
              >
                Back
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3"
            >
              {loading ? 'Saving...' : 
               step === 3 ? 'Complete Profile' : 
               'Continue'}
            </Button>
          </div>

          {step === 1 && (
            <div className="text-center">
              <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
                Skip for now
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
