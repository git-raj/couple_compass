interface ChatInvitation {
  id: number
  session_id: number
  inviter_id: number
  invitee_id: number
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  invitation_message?: string
  inviter_name: string
  created_at: string
  expires_at?: string
  responded_at?: string
  updated_at: string
}

interface ChatSession {
  id: number
  title: string
  user_id: number
  partner_user_id?: number
  session_type: 'ai_mediation' | 'couple_chat'
  status: string
  topic?: string
  last_activity: string
  created_at: string
  updated_at: string
}

interface ChatMessage {
  id: number
  session_id: number
  user_id?: number
  role: 'user' | 'ai' | 'partner' | 'system'
  content: string
  message_type: string
  created_at: string
  updated_at: string
  is_edited: boolean
  is_deleted: boolean
  tokens_used?: number
  metadata?: any
}

interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

class ChatService {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
  }

  private getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch {
        errorMessage = errorText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }
    
    return response.text() as any
  }

  // Chat Sessions
  async createChatSession(title?: string, sessionType: 'ai_mediation' | 'couple_chat' = 'ai_mediation'): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/chat/sessions`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: title || 'New Conversation',
        session_type: sessionType
      })
    })

    return this.handleResponse<ChatSession>(response)
  }

  async getChatSessions(limit: number = 20, offset: number = 0): Promise<ChatSession[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })

    const response = await fetch(`${this.baseUrl}/chat/sessions?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<ChatSession[]>(response)
  }

  async getChatSession(sessionId: number): Promise<{ session: ChatSession, messages: ChatMessage[] }> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    const sessionWithMessages = await this.handleResponse<any>(response)
    return {
      session: sessionWithMessages,
      messages: sessionWithMessages.messages || []
    }
  }

  async sendMessage(sessionId: number, content: string, messageType: string = 'text'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        content,
        message_type: messageType
      })
    })

    return this.handleResponse<any>(response)
  }

  async getChatHistory(sessionId: number, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })

    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/history?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<ChatMessage[]>(response)
  }

  async deleteChatSession(sessionId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    await this.handleResponse<any>(response)
  }

  // Chat Invitations
  async getPendingInvitations(): Promise<ChatInvitation[]> {
    const response = await fetch(`${this.baseUrl}/chat/invitations`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<ChatInvitation[]>(response)
  }

  async invitePartnerToSession(sessionId: number, invitationMessage?: string): Promise<ChatInvitation> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/invite-partner`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        session_id: sessionId,
        invitation_message: invitationMessage
      })
    })

    return this.handleResponse<ChatInvitation>(response)
  }

  async acceptInvitation(invitationId: number): Promise<{ message: string, session_id: number }> {
    const response = await fetch(`${this.baseUrl}/chat/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<{ message: string, session_id: number }>(response)
  }

  async declineInvitation(invitationId: number, reason?: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/chat/invitations/${invitationId}/decline`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        invitation_id: invitationId,
        reason
      })
    })

    return this.handleResponse<{ message: string }>(response)
  }

  // Session participants
  async getSessionParticipants(sessionId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/participants`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<any>(response)
  }

  // Chat statistics
  async getChatStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/chat/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<any>(response)
  }

  async updateSessionTitle(sessionId: number, title: string): Promise<ChatSession> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/title`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title })
    })

    return this.handleResponse<ChatSession>(response)
  }

  async generateSessionSummary(sessionId: number): Promise<{ summary: string }> {
    const response = await fetch(`${this.baseUrl}/chat/sessions/${sessionId}/summary`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    })

    return this.handleResponse<{ summary: string }>(response)
  }
}

// Export singleton instance
export const chatService = new ChatService()
export default chatService

// Export types
export type {
  ChatInvitation,
  ChatSession,
  ChatMessage,
  ApiResponse
}
