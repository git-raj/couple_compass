'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Clock, User } from 'lucide-react'

interface PartnerInvitationProps {
  invitation: {
    id: number
    session_id: number
    inviter_id: number
    invitee_id: number
    status: 'pending' | 'accepted' | 'declined' | 'expired'
    invitation_message?: string
    inviter_name: string
    created_at: string
  }
  onAccept: (invitationId: number) => void
  onDecline: (invitationId: number) => void
  onDismiss?: (invitationId: number) => void
  type: 'received' | 'sent'
}

export default function PartnerInvitation({ 
  invitation, 
  onAccept, 
  onDecline, 
  onDismiss,
  type 
}: PartnerInvitationProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAccept(invitation.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDecline = async () => {
    setIsLoading(true)
    try {
      await onDecline(invitation.id)
    } finally {
      setIsLoading(false)
    }
  }

  const getInvitationContent = () => {
    if (type === 'received') {
      return {
        title: 'Chat Invitation Received',
        message: `${invitation.inviter_name} invited you to join their chat session`,
        icon: <User className="w-5 h-5 text-blue-600" />
      }
    } else {
      return {
        title: 'Invitation Sent',
        message: `Waiting for your partner to accept the chat invitation`,
        icon: <Clock className="w-5 h-5 text-orange-600" />
      }
    }
  }

  const content = getInvitationContent()

  return (
    <div className="bg-blue-50 border-l-4 border-l-blue-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {content.icon}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">
              {content.title}
            </h4>
            <p className="text-sm text-blue-800 mt-1">
              {content.message}
            </p>
            {invitation.invitation_message && (
              <p className="text-sm text-blue-700 mt-2 italic">
                "{invitation.invitation_message}"
              </p>
            )}
            <p className="text-xs text-blue-600 mt-2">
              {new Date(invitation.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {type === 'received' && invitation.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={handleAccept}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                disabled={isLoading}
                className="border-red-300 text-red-600 hover:bg-red-50 px-3 py-1 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Decline
              </Button>
            </>
          )}
          
          {type === 'sent' && invitation.status === 'pending' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDismiss?.(invitation.id)}
              className="text-blue-600 hover:bg-blue-100 px-2 py-1"
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {invitation.status !== 'pending' && (
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                invitation.status === 'accepted' 
                  ? 'bg-green-100 text-green-800' 
                  : invitation.status === 'declined'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDismiss?.(invitation.id)}
                className="text-gray-400 hover:bg-gray-100 px-2 py-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
