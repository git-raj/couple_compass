'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { chatService, type ChatInvitation } from '@/services/chatService'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Notification {
  id: string
  type: 'invitation' | 'message' | 'success' | 'error' | 'info'
  title: string
  message: string
  data?: any
  timestamp: Date
  read: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  pendingInvitations: ChatInvitation[]
  unreadCount: number
  invitationCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  removeNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  refreshInvitations: () => Promise<void>
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<ChatInvitation[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const unreadCount = notifications.filter(n => !n.read).length
  const invitationCount = pendingInvitations.length

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep only last 50 notifications
  }, [])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const refreshInvitations = useCallback(async () => {
    try {
      const invitations = await chatService.getPendingInvitations()
      setPendingInvitations(invitations)
    } catch (error) {
      console.error('Error fetching pending invitations:', error)
    }
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    addNotification({
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message
    })

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1))
    }, 5000)
  }, [addNotification])

  // Handle incoming WebSocket notifications
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'invitation':
        addNotification({
          type: 'invitation',
          title: 'Chat Invitation',
          message: message.message || 'You have received a new chat invitation',
          data: message
        })
        // Refresh invitations to get the latest data
        refreshInvitations()
        break
        
      case 'invitation_accepted':
        addNotification({
          type: 'success',
          title: 'Invitation Accepted',
          message: message.message || 'Your chat invitation was accepted',
          data: message
        })
        refreshInvitations()
        break
        
      case 'invitation_declined':
        addNotification({
          type: 'info',
          title: 'Invitation Declined',
          message: message.message || 'Your chat invitation was declined',
          data: message
        })
        refreshInvitations()
        break
        
      case 'partner_joined':
        addNotification({
          type: 'success',
          title: 'Partner Joined',
          message: message.message || 'Your partner has joined the chat',
          data: message
        })
        break
        
      case 'partner_left':
        addNotification({
          type: 'info',
          title: 'Partner Left',
          message: message.message || 'Your partner has left the chat',
          data: message
        })
        break
        
      case 'message':
        // Only show notification if it's not from the current user
        if (message.user_id && message.user_id !== currentUserId) {
          addNotification({
            type: 'message',
            title: 'New Message',
            message: message.content || 'You have a new message',
            data: message
          })
        }
        break
    }
  }, [addNotification, refreshInvitations, currentUserId])

  // Set up WebSocket connection
  const { isConnected } = useWebSocket(currentUserId, {
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('WebSocket error in NotificationProvider:', error)
    }
  })

  // Initialize user and invitations on mount
  useEffect(() => {
    const initializeProvider = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null
        
        if (token && userData) {
          const user = JSON.parse(userData)
          setCurrentUserId(user.id)
          await refreshInvitations()
        }
      } catch (error) {
        console.error('Error initializing notification provider:', error)
      }
    }

    initializeProvider()
  }, [refreshInvitations])

  // Periodically refresh invitations (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      if (token) {
        refreshInvitations()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [refreshInvitations])

  const contextValue: NotificationContextType = {
    notifications,
    pendingInvitations,
    unreadCount,
    invitationCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshInvitations,
    showToast
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export default NotificationContext

// Export types
export type { Notification, NotificationContextType }
