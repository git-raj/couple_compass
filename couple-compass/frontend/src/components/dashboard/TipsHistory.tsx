'use client'

import { useState, useEffect } from 'react'
import { 
  ArrowLeftIcon,
  SparklesIcon,
  ExclamationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import TipCard from './TipCard'

interface Tip {
  id: number  // Changed from string to number to match backend
  content: string
  category: string
  created_at: string
}

interface TipsHistoryProps {
  onClose: () => void
  onGenerateNew: () => void
  isGenerating: boolean
}

export default function TipsHistory({ onClose, onGenerateNew, isGenerating }: TipsHistoryProps) {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
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

  // Fetch tips history on component mount
  useEffect(() => {
    fetchTipsHistory()
  }, [])

  const fetchTipsHistory = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = getAuthToken()
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch(`${getApiUrl()}/tips/history?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTips(data.tips || [])
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to fetch tips history')
      }
    } catch (error) {
      console.error('Error fetching tips history:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNew = async () => {
    await onGenerateNew()
    // Refresh the history after generating a new tip
    await fetchTipsHistory()
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center space-x-2">
            <ClockIcon className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Tips History</h2>
              <p className="text-sm text-gray-600">Your past relationship advice</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading your tips...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 text-sm font-medium">Unable to load tips history</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchTipsHistory}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Tips List */}
      {!loading && !error && (
        <>
          {tips.length > 0 ? (
            <div className="space-y-4 mb-6">
              {tips.map((tip, index) => (
                <TipCard 
                  key={tip.id} 
                  tip={tip} 
                  isLatest={index === 0} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <SparklesIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tips yet</h3>
              <p className="text-gray-600 mb-6">
                Start building your tips history by generating your first personalized relationship tip.
              </p>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center pt-4 border-t border-gray-100">
            <Button
              onClick={handleGenerateNew}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Generate New Tip
                </>
              )}
            </Button>
          </div>

          {/* Tips count info */}
          {tips.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Showing your {tips.length} most recent tip{tips.length !== 1 ? 's' : ''}
                {tips.length === 5 && ' (maximum)'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
