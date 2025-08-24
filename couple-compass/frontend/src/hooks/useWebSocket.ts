'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface WebSocketHookOptions {
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
  autoReconnect?: boolean
  reconnectInterval?: number
}

export const useWebSocket = (userId: number | null, options: WebSocketHookOptions = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    autoReconnect = true,
    reconnectInterval = 5000
  } = options

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000'
    return `${protocol}//${host}/api/v1/chat/ws/${userId}`
  }, [userId])

  const connect = useCallback(() => {
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      setConnectionStatus('connecting')
      const wsUrl = getWebSocketUrl()
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setConnectionStatus('connected')
        onOpen?.()
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('WebSocket message received:', message)
          onMessage?.(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        onClose?.()

        // Auto-reconnect if enabled and connection was not closed intentionally
        if (autoReconnect && event.code !== 1000) {
          console.log(`Attempting to reconnect in ${reconnectInterval}ms...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
        onError?.(error)
      }

    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [userId, getWebSocketUrl, autoReconnect, reconnectInterval]) // Remove callback dependencies that change frequently

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting')
      wsRef.current = null
    }
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    } else {
      console.error('WebSocket is not connected')
      return false
    }
  }, [])

  const sendTyping = useCallback((sessionId: number, isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      session_id: sessionId,
      is_typing: isTyping
    })
  }, [sendMessage])

  const sendPing = useCallback(() => {
    sendMessage({ type: 'ping' })
  }, [sendMessage])

  // Connect when userId is available
  useEffect(() => {
    if (userId) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [userId]) // Remove connect and disconnect from dependencies to prevent infinite loop

  // Ping interval to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const pingInterval = setInterval(() => {
      sendPing()
    }, 30000) // Ping every 30 seconds

    return () => clearInterval(pingInterval)
  }, [isConnected, sendPing])

  return {
    isConnected,
    connectionStatus,
    sendMessage,
    sendTyping,
    connect,
    disconnect
  }
}
