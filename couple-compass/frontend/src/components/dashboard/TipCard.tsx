'use client'

import { useState } from 'react'
import { 
  HeartIcon, 
  ChatBubbleLeftRightIcon, 
  SparklesIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ScaleIcon
} from '@heroicons/react/24/outline'

interface Tip {
  id: number  // Changed from string to number to match backend
  content: string
  category: string
  created_at: string
}

interface TipCardProps {
  tip: Tip
  isLatest?: boolean
}

export default function TipCard({ tip, isLatest = false }: TipCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'communication':
        return ChatBubbleLeftRightIcon
      case 'quality time':
        return ClockIcon
      case 'emotional support':
        return HeartIcon
      case 'conflict resolution':
        return ScaleIcon
      case 'personal growth':
        return AcademicCapIcon
      default:
        return SparklesIcon
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'communication':
        return 'text-blue-600 bg-blue-100'
      case 'quality time':
        return 'text-green-600 bg-green-100'
      case 'emotional support':
        return 'text-pink-600 bg-pink-100'
      case 'conflict resolution':
        return 'text-orange-600 bg-orange-100'
      case 'personal growth':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return 'Today'
    } else if (diffDays === 2) {
      return 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const shouldTruncate = tip.content.length > 150
  const displayContent = (!isExpanded && shouldTruncate) 
    ? tip.content.substring(0, 150) + '...' 
    : tip.content

  const Icon = getCategoryIcon(tip.category)
  const colorClasses = getCategoryColor(tip.category)

  return (
    <div className={`rounded-lg border p-4 ${
      isLatest 
        ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200' 
        : 'bg-white border-gray-200'
    } hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-900 capitalize">
              {tip.category}
            </span>
            {isLatest && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Latest
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {formatDate(tip.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-800 leading-relaxed text-sm">
          {displayContent}
        </p>
        
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {isExpanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Footer actions (for future features) */}
      {isLatest && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>💡 AI-generated based on your profile</span>
          </div>
        </div>
      )}
    </div>
  )
}
