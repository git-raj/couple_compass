'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Users, UserPlus, Heart } from 'lucide-react'
import PartnerInvitation from '@/components/chat/PartnerInvitation'
import PartnerStatus from '@/components/chat/PartnerStatus'
import TypingIndicator from '@/components/chat/TypingIndicator'
import PartnerConnectionModal from '@/components/profile/PartnerConnectionModal'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useNotifications } from '@/contexts/NotificationContext'
import { chatService, type ChatInvitation, type ChatSession, type ChatMessage } from '@/services/chatService'

// Updated interfaces
interface ChatMessageDisplay {
  id: number
  role: 'user' | 'ai' | 'partner'
  content: string
  createdAt: Date
  suggestedActions?: string[]
  user_id?: number
}

interface ChatSessionDisplay {
  id: number
  title: string
  messages: ChatMessageDisplay[]
  sessionType?: 'ai_mediation' | 'couple_chat'
  partner?: {
    id: number
    name: string
    is_online: boolean
    is_in_session: boolean
  }
}

interface UserProfile {
  id: number
  name: string
  hasPartner: boolean
  partnerId?: number
  partnerName?: string
}

export default function ChatPage() {
  const router = useRouter()
  const [currentSession, setCurrentSession] = useState<ChatSessionDisplay | null>(null)
  const [sessions, setSessions] = useState<ChatSessionDisplay[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showPartnerConnectionModal, setShowPartnerConnectionModal] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { pendingInvitations, refreshInvitations, showToast } = useNotifications()

  // WebSocket for real-time communication
  const { isConnected, sendTyping } = useWebSocket(
    userProfile?.id || null,
    {
      onMessage: (message) => {
        handleWebSocketMessage(message)
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
        showToast('Connection error. Some features may not work properly.', 'error')
      }
    }
  )

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'message':
        if (currentSession && message.session_id === currentSession.id) {
          const newMessage: ChatMessageDisplay = {
            id: message.id || Date.now(),
            role: message.metadata?.role || 'partner',
            content: message.content,
            createdAt: new Date(),
            suggestedActions: message.metadata?.suggested_actions,
            user_id: message.user_id
          }
          
          setCurrentSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, newMessage]
          } : null)
        }
        break
        
      case 'typing':
        if (currentSession && message.session_id === currentSession.id && message.user_id !== userProfile?.id) {
          setPartnerTyping(message.is_typing)
        }
        break
        
      case 'partner_joined':
        if (currentSession && message.session_id === currentSession.id) {
          setCurrentSession(prev => prev ? {
            ...prev,
            sessionType: 'couple_chat',
            partner: {
              id: message.partner_id,
              name: message.partner_name,
              is_online: true,
              is_in_session: true
            }
          } : null)
        }
        break
    }
  }

  // Initialize chat page
  useEffect(() => {
    const initializePage = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) {
          router.push('/login')
          return
        }

        const userData = localStorage.getItem('user')
        if (!userData) {
          router.push('/login')
          return
        }

        const user = JSON.parse(userData)
        setUserProfile({
          id: user.id,
          name: user.name,
          hasPartner: !!user.partner_id,
          partnerId: user.partner_id,
          partnerName: user.partner_name
        })

        // Load chat sessions
        await loadChatSessions()
        
        // Refresh invitations
        await refreshInvitations()

      } catch (error) {
        console.error('Error initializing chat page:', error)
        showToast('Failed to load chat data', 'error')
      } finally {
        setInitialLoading(false)
      }
    }

    initializePage()
  }, [router, refreshInvitations, showToast])

  const loadChatSessions = async () => {
    try {
      const sessionsData = await chatService.getChatSessions()
      const displaySessions: ChatSessionDisplay[] = await Promise.all(
        sessionsData.map(async (session) => {
          try {
            const { messages } = await chatService.getChatSession(session.id)
            return {
              id: session.id,
              title: session.title,
              sessionType: session.session_type as 'ai_mediation' | 'couple_chat',
              messages: messages.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'ai' | 'partner',
                content: msg.content,
                createdAt: new Date(msg.created_at),
                suggestedActions: msg.metadata?.suggested_actions,
                user_id: msg.user_id
              }))
            }
          } catch (error) {
            console.error(`Error loading session ${session.id}:`, error)
            return {
              id: session.id,
              title: session.title,
              sessionType: session.session_type as 'ai_mediation' | 'couple_chat',
              messages: []
            }
          }
        })
      )

      setSessions(displaySessions)
      
      // Set current session to the first one or create a new one
      if (displaySessions.length > 0) {
        setCurrentSession(displaySessions[0])
      } else {
        await createNewSession()
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      // Create a new session if loading fails
      await createNewSession()
    }
  }

  const createNewSession = async () => {
    try {
      const newSession = await chatService.createChatSession()
      const displaySession: ChatSessionDisplay = {
        id: newSession.id,
        title: newSession.title,
        sessionType: newSession.session_type as 'ai_mediation' | 'couple_chat',
        messages: [
          {
            id: Date.now(),
            role: 'ai',
            content: "Hello! I'm your AI Advisor. I'm here to help when you need guidance or have questions. Feel free to chat with your partner, and mention me if you'd like my input.",
            createdAt: new Date(),
            suggestedActions: ['Discuss communication', 'Talk about conflicts', 'Share feelings']
          }
        ]
      }
      
      setSessions(prev => [displaySession, ...prev])
      setCurrentSession(displaySession)
    } catch (error) {
      console.error('Error creating new session:', error)
      showToast('Failed to create new chat session', 'error')
    }
  }

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  const shouldAIRespond = (message: string): boolean => {
    const lowerMessage = message.toLowerCase()
    
    // Check for direct AI mentions
    if (lowerMessage.includes('ai') || lowerMessage.includes('advisor')) {
      return true
    }
    
    // Check for help-seeking keywords
    if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('suggest')) {
      return true
    }
    
    // Check for request phrases
    if (lowerMessage.includes('what should') || lowerMessage.includes('how do') || 
        lowerMessage.includes('can you') || lowerMessage.includes('please')) {
      return true
    }
    
    // Check for questions (contains question mark) but exclude casual partner chat
    if (message.includes('?')) {
      // Exclude common casual questions between partners
      const casualQuestions = [
        'how was your day', 'how are you', 'what are you doing', 
        'where are you', 'when are you', 'are you okay', 'you okay',
        'how was work', 'how did it go', 'did you eat', 'are you home'
      ]
      
      const isCasualQuestion = casualQuestions.some(casual => lowerMessage.includes(casual))
      if (!isCasualQuestion) {
        return true
      }
    }
    
    return false
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading) return

    const userMessage: ChatMessageDisplay = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date(),
      user_id: userProfile?.id
    }

    // Add user message immediately
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    }
    setCurrentSession(updatedSession)
    const messageToCheck = inputMessage
    setInputMessage('')

    // Send typing indicator
    if (isConnected) {
      sendTyping(currentSession.id, false)
    }

    try {
      // Send message to backend
      const response = await chatService.sendMessage(currentSession.id, messageToCheck)
      
      // If AI responded, add the AI message
      if (response.ai_response) {
        const aiMessage: ChatMessageDisplay = {
          id: response.ai_response.id || Date.now() + 1,
          role: 'ai',
          content: response.ai_response.content,
          createdAt: new Date(response.ai_response.created_at || new Date()),
          suggestedActions: response.suggested_actions
        }

        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, aiMessage]
        } : null)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      showToast('Failed to send message', 'error')
    }
  }

  const generateMockAIResponse = (userInput: string): string => {
    const responses = [
      "I understand you're dealing with a challenging situation. Communication is key in any relationship. Can you tell me more about how you and your partner typically discuss difficult topics?",
      "It sounds like there are some underlying emotions here. Have you been able to express how this makes you feel to your partner? Sometimes using 'I' statements can help avoid blame and create a safer space for dialogue.",
      "Conflict is normal in relationships, but how we handle it makes all the difference. What approaches have you tried so far, and how did your partner respond?",
      "Thank you for sharing that with me. It takes courage to address these issues. Let's explore some strategies that might help you both feel more heard and understood."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const generateMockSuggestions = (userInput: string): string[] => {
    const suggestions = [
      ['Practice active listening', 'Set up regular check-ins', 'Use "I" statements'],
      ['Plan a calm discussion', 'Focus on solutions together', 'Take breaks when heated'],
      ['Express appreciation daily', 'Create quality time', 'Share your feelings openly'],
      ['Seek couples counseling', 'Read relationship books together', 'Try new activities together']
    ]
    return suggestions[Math.floor(Math.random() * suggestions.length)]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewSession = async () => {
    try {
      const newSession = await chatService.createChatSession(`New Chat ${sessions.length + 1}`)
      const displaySession: ChatSessionDisplay = {
        id: newSession.id,
        title: newSession.title,
        sessionType: newSession.session_type as 'ai_mediation' | 'couple_chat',
        messages: [
          {
            id: Date.now(),
            role: 'ai',
            content: "Hello! I'm your AI Advisor. I'm here to help when you need guidance or have questions. Feel free to chat with your partner, and mention me if you'd like my input.",
            createdAt: new Date()
          }
        ]
      }
      
      setSessions([displaySession, ...sessions])
      setCurrentSession(displaySession)
    } catch (error) {
      console.error('Error creating new session:', error)
      showToast('Failed to create new session', 'error')
    }
  }

  const handleInvitePartner = async () => {
    if (!currentSession || !userProfile?.hasPartner) return

    setIsLoadingInvitation(true)
    try {
      await chatService.invitePartnerToSession(currentSession.id, `Join me in this relationship chat session`)
      await refreshInvitations()
      showToast('Invitation sent to your partner!', 'success')
    } catch (error) {
      console.error('Failed to invite partner:', error)
      showToast('Failed to send invitation', 'error')
    } finally {
      setIsLoadingInvitation(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      const result = await chatService.acceptInvitation(invitationId)
      await refreshInvitations()
      showToast('Invitation accepted!', 'success')
      
      // Redirect to the session
      if (result.session_id) {
        try {
          const { session, messages } = await chatService.getChatSession(result.session_id)
          const displaySession: ChatSessionDisplay = {
            id: session.id,
            title: session.title,
            sessionType: session.session_type as 'ai_mediation' | 'couple_chat',
            messages: messages.map(msg => ({
              id: msg.id,
              role: msg.role as 'user' | 'ai' | 'partner',
              content: msg.content,
              createdAt: new Date(msg.created_at),
              suggestedActions: msg.metadata?.suggested_actions,
              user_id: msg.user_id
            })),
            partner: {
              id: userProfile?.partnerId || 0,
              name: userProfile?.partnerName || 'Partner',
              is_online: true,
              is_in_session: true
            }
          }
          setCurrentSession(displaySession)
        } catch (error) {
          console.error('Error loading accepted session:', error)
        }
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      showToast('Failed to accept invitation', 'error')
    }
  }

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      await chatService.declineInvitation(invitationId)
      await refreshInvitations()
      showToast('Invitation declined', 'info')
    } catch (error) {
      console.error('Failed to decline invitation:', error)
      showToast('Failed to decline invitation', 'error')
    }
  }

  const handleDismissInvitation = async (invitationId: number) => {
    await refreshInvitations()
  }

  const refreshUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(userData))
        
        // Update local state
        setUserProfile({
          id: userData.id,
          name: userData.name,
          hasPartner: !!userData.partner_id,
          partnerId: userData.partner_id,
          partnerName: userData.partner_name
        })
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error)
    }
  }

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (isConnected && currentSession) {
      sendTyping(currentSession.id, isTyping)
    }
  }

  // Check if user can invite partner
  const canInvitePartner = () => {
    if (!userProfile?.hasPartner) return false
    if (currentSession?.sessionType === 'couple_chat') return false
    const hasPendingInvitation = pendingInvitations.some(
      inv => inv.session_id === currentSession?.id && inv.status === 'pending'
    )
    return !hasPendingInvitation
  }

  // Get session-specific invitations
  const getSessionInvitations = () => {
    if (!currentSession) return []
    return pendingInvitations.filter(inv => inv.session_id === currentSession.id)
  }

  if (initialLoading || !currentSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Couple Compass Chat</h1>
          <Button 
            onClick={startNewSession}
            className="w-full mt-3 bg-primary-600 hover:bg-primary-700"
          >
            + New Conversation
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setCurrentSession(session)}
              className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                currentSession?.id === session.id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
              }`}
            >
              <h3 className="font-medium text-gray-900 truncate">{session.title}</h3>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {session.messages[session.messages.length - 1]?.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{currentSession.title}</h2>
                <p className="text-sm text-gray-500">AI Advisor available when needed</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Partner Status Indicator */}
              <PartnerStatus
                partner={currentSession.partner}
                sessionType={currentSession.sessionType || 'ai_mediation'}
              />
              
              {/* Partner Connection / Invitation Buttons */}
              {!userProfile?.hasPartner ? (
                // No partner connected - show connect button
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100"
                  onClick={() => setShowPartnerConnectionModal(true)}
                >
                  <Heart className="w-4 h-4" />
                  <span>Invite Partner</span>
                </Button>
              ) : canInvitePartner() ? (
                // Partner connected but not in this session - show add partner button
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100"
                  onClick={handleInvitePartner}
                  disabled={isLoadingInvitation}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoadingInvitation ? 'Sending...' : 'Add Partner'}</span>
                </Button>
              ) : getSessionInvitations().length > 0 ? (
                // Show pending invitation status
                <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                  <span>Invitation sent to partner</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Partner Invitations */}
        {getSessionInvitations().length > 0 && (
          <div className="p-4 space-y-2">
            {getSessionInvitations().map(invitation => (
              <PartnerInvitation
                key={invitation.id}
                invitation={invitation}
                onAccept={handleAcceptInvitation}
                onDecline={handleDeclineInvitation}
                onDismiss={handleDismissInvitation}
                type={invitation.inviter_id === userProfile?.id ? 'sent' : 'received'}
              />
            ))}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Partner Connection Notice */}
          {!userProfile?.hasPartner && currentSession.messages.length <= 1 && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Heart className="w-6 h-6 text-pink-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">Connect with Your Partner</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Unlock the full potential of Couple Compass by connecting with your partner. Share relationship insights, track progress together, and get personalized advice.
                  </p>
                  <Button
                    onClick={() => setShowPartnerConnectionModal(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    size="sm"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Invite Partner
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {currentSession.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : message.role === 'partner'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                {/* Show sender name for partner messages */}
                {message.role === 'partner' && (
                  <p className="text-xs text-purple-200 mb-1 font-medium">
                    {currentSession.partner?.name || 'Partner'}
                  </p>
                )}
                <div className="mb-2">
                  <p className="text-sm">{message.content}</p>
                </div>
                
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-gray-500">Suggested actions:</p>
                    {message.suggestedActions.map((action, index) => (
                      <div key={index} className="text-xs bg-gray-50 rounded px-2 py-1 text-gray-700">
                        • {action}
                      </div>
                    ))}
                  </div>
                )}
                
                <p className={`text-xs mt-2 ${
                  message.role === 'user' 
                    ? 'text-primary-200'
                    : message.role === 'partner'
                    ? 'text-purple-200'
                    : 'text-gray-400'
                }`}>
                  {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Partner typing indicator */}
          <TypingIndicator 
            partnerName={currentSession.partner?.name || 'Partner'}
            isVisible={partnerTyping}
          />
          
          {/* AI typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value)
                handleTyping(e.target.value.length > 0)
              }}
              onKeyPress={handleKeyPress}
              onBlur={() => handleTyping(false)}
              placeholder="Type your message here..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line • Mention "AI" or "advisor" for AI responses
          </p>
        </div>
      </div>

      {/* Partner Connection Modal */}
      <PartnerConnectionModal
        isOpen={showPartnerConnectionModal}
        onClose={async () => {
          setShowPartnerConnectionModal(false)
          // Refresh user profile to check if partner was connected
          await refreshUserProfile()
        }}
      />
    </div>
  )
}
