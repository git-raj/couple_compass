'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Mock data - in production, this would come from GraphQL
interface ChatMessage {
  id: number
  role: 'user' | 'ai' | 'partner'
  content: string
  createdAt: Date
  suggestedActions?: string[]
}

interface ChatSession {
  id: number
  title: string
  messages: ChatMessage[]
}

export default function ChatPage() {
  const router = useRouter()
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock authentication check
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }
    
    // Initialize with a mock session
    const mockSession: ChatSession = {
      id: 1,
      title: 'Relationship Chat',
      messages: [
        {
          id: 1,
          role: 'ai',
          content: "Hello! I'm here to help you and your partner work through any relationship challenges. What would you like to discuss today?",
          createdAt: new Date(),
          suggestedActions: ['Discuss communication', 'Talk about conflicts', 'Share feelings']
        }
      ]
    }
    
    setSessions([mockSession])
    setCurrentSession(mockSession)
  }, [router])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentSession?.messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date()
    }

    // Add user message immediately
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage]
    }
    setCurrentSession(updatedSession)
    setInputMessage('')
    setIsLoading(true)
    setIsTyping(true)

    // Simulate AI response (in production, this would be a GraphQL mutation)
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'ai',
        content: generateMockAIResponse(inputMessage),
        createdAt: new Date(),
        suggestedActions: generateMockSuggestions(inputMessage)
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage]
      }
      
      setCurrentSession(finalSession)
      setIsLoading(false)
      setIsTyping(false)
    }, 2000)
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

  const startNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now(),
      title: `New Chat ${sessions.length + 1}`,
      messages: [
        {
          id: Date.now(),
          role: 'ai',
          content: "Hello! I'm here to help you and your partner work through any relationship challenges. What would you like to discuss today?",
          createdAt: new Date()
        }
      ]
    }
    
    setSessions([...sessions, newSession])
    setCurrentSession(newSession)
  }

  if (!currentSession) {
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
          <h2 className="text-lg font-semibold text-gray-900">{currentSession.title}</h2>
          <p className="text-sm text-gray-500">AI Relationship Mediator</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentSession.messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
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
                
                <p className="text-xs text-gray-400 mt-2">
                  {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
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
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
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
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
