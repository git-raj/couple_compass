'use client'

import { useState, useEffect } from 'react'
import { 
  SparklesIcon, 
  ClockIcon, 
  ArrowRightIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import TipCard from './TipCard'
import TipsHistory from './TipsHistory'

interface Tip {
  id: number  // Changed from string to number to match backend
  content: string
  category: string
  created_at: string
}

interface RelationshipTipsProps {
  onClose?: () => void
}

export default function RelationshipTips({ onClose }: RelationshipTipsProps) {
  const [latestTip, setLatestTip] = useState<Tip | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get API base URL
  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  }

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token')
    }
    return null
  }

  // Fetch latest tip on component mount
  useEffect(() => {
    fetchLatestTip()
  }, [])

  const fetchLatestTip = async () => {
    try {
      const token = getAuthToken()
      if (!token) return

      const response = await fetch(`${getApiUrl()}/tips/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const tip = await response.json()
        setLatestTip(tip)
      } else if (response.status !== 404) {
        console.error('Error fetching latest tip:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching latest tip:', error)
    }
  }

  const generateNewTip = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/tips/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        const newTip = await response.json()
        setLatestTip(newTip)
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to generate tip')
      }
    } catch (error) {
      console.error('Error generating tip:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewHistory = () => {
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
  }

  if (showHistory) {
    return (
      <TipsHistory 
        onClose={handleCloseHistory}
        onGenerateNew={generateNewTip}
        isGenerating={isGenerating}
      />
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Relationship Tips</h2>
            <p className="text-sm text-gray-600">Personalized advice just for you</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 text-sm font-medium">Unable to generate tip</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Latest Tip */}
      {latestTip ? (
        <div className="mb-6">
          <TipCard tip={latestTip} isLatest={true} />
        </div>
      ) : (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg text-center">
          <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tips yet</h3>
          <p className="text-gray-600 mb-4">
            Generate your first personalized relationship tip based on your profile and interactions.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={generateNewTip}
          disabled={isGenerating}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              {latestTip ? 'Generate New Tip' : 'Get Your First Tip'}
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleViewHistory}
          className="flex-1"
        >
          <ClockIcon className="w-4 h-4 mr-2" />
          View History
        </Button>
      </div>

      {/* Rate Limit Info */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          You can generate up to 3 tips per day to ensure quality and personalization.
        </p>
      </div>
    </div>
  )
}
