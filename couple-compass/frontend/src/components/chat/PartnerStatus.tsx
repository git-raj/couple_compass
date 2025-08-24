'use client'

import { Users, UserCheck, UserMinus, Circle } from 'lucide-react'

interface PartnerStatusProps {
  partner?: {
    id: number
    name: string
    is_online: boolean
    is_in_session: boolean
    last_seen?: string
  }
  sessionType: 'ai_mediation' | 'couple_chat'
  isLoading?: boolean
}

export default function PartnerStatus({ 
  partner, 
  sessionType, 
  isLoading = false 
}: PartnerStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Loading...</span>
      </div>
    )
  }

  if (sessionType === 'couple_chat' && partner) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="flex items-center space-x-1">
          <Circle 
            className={`w-2 h-2 fill-current ${
              partner.is_online ? 'text-green-500' : 'text-gray-400'
            }`} 
          />
          <UserCheck className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-gray-900 font-medium">
            {partner.name}
          </span>
          <span className="text-xs text-gray-500">
            {partner.is_online ? 'Online' : `Last seen ${partner.last_seen}`}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500">
      <Users className="w-4 h-4" />
      <span>Solo Session</span>
    </div>
  )
}
