import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { HttpClientService } from '../shared/services/http-client.service';
import {
  ChatSession,
  ChatMessage,
  ChatResponse,
  ChatStats,
} from './entities/chat.entity';
import {
  CreateChatSessionInput,
  SendMessageInput,
  UpdateSessionTitleInput,
  ChatHistoryInput,
  ChatSessionsInput,
} from './dto/chat.input';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly httpClient: HttpClientService) {}

  async createChatSession(
    input: CreateChatSessionInput,
    token: string,
  ): Promise<ChatSession> {
    try {
      const response = await this.httpClient.post<ChatSession>(
        '/api/v1/chat/sessions',
        {
          title: input.title,
          partner_user_id: input.partnerUserId,
          session_type: input.sessionType,
          topic: input.topic,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return this.mapChatSessionResponse(response);
    } catch (error) {
      this.logger.error('Failed to create chat session', error);
      throw error;
    }
  }

  async getChatSessions(
    input: ChatSessionsInput,
    token: string,
  ): Promise<ChatSession[]> {
    try {
      const response = await this.httpClient.get<ChatSession[]>(
        '/api/v1/chat/sessions',
        {
          params: {
            limit: input.limit,
            offset: input.offset,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.map(session => this.mapChatSessionResponse(session));
    } catch (error) {
      this.logger.error('Failed to get chat sessions', error);
      throw error;
    }
  }

  async getChatSession(
    sessionId: number,
    token: string,
  ): Promise<ChatSession> {
    try {
      const response = await this.httpClient.get<ChatSession>(
        `/api/v1/chat/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return this.mapChatSessionWithMessages(response);
    } catch (error) {
      this.logger.error(`Failed to get chat session ${sessionId}`, error);
      throw error;
    }
  }

  async sendMessage(
    input: SendMessageInput,
    token: string,
  ): Promise<ChatResponse> {
    try {
      const response = await this.httpClient.post<any>(
        `/api/v1/chat/sessions/${input.sessionId}/messages`,
        {
          content: input.content,
          message_type: input.messageType,
          parent_message_id: input.parentMessageId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return {
        userMessage: this.mapChatMessageResponse(response.user_message),
        aiResponse: this.mapChatMessageResponse(response.ai_response),
        suggestedActions: response.suggested_actions,
        confidenceScore: response.confidence_score,
      };
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw error;
    }
  }

  async getChatHistory(
    input: ChatHistoryInput,
    token: string,
  ): Promise<ChatMessage[]> {
    try {
      const response = await this.httpClient.get<ChatMessage[]>(
        `/api/v1/chat/sessions/${input.sessionId}/history`,
        {
          params: {
            limit: input.limit,
            offset: input.offset,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.map(message => this.mapChatMessageResponse(message));
    } catch (error) {
      this.logger.error('Failed to get chat history', error);
      throw error;
    }
  }

  async deleteChatSession(sessionId: number, token: string): Promise<boolean> {
    try {
      await this.httpClient.delete(`/api/v1/chat/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to delete chat session ${sessionId}`, error);
      throw error;
    }
  }

  async updateSessionTitle(
    input: UpdateSessionTitleInput,
    token: string,
  ): Promise<ChatSession> {
    try {
      const response = await this.httpClient.put<ChatSession>(
        `/api/v1/chat/sessions/${input.sessionId}/title`,
        {
          title: input.title,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return this.mapChatSessionResponse(response);
    } catch (error) {
      this.logger.error('Failed to update session title', error);
      throw error;
    }
  }

  async generateSessionSummary(
    sessionId: number,
    token: string,
  ): Promise<string> {
    try {
      const response = await this.httpClient.post<{ summary: string }>(
        `/api/v1/chat/sessions/${sessionId}/summary`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return response.summary;
    } catch (error) {
      this.logger.error('Failed to generate session summary', error);
      throw error;
    }
  }

  async getChatStats(token: string): Promise<ChatStats> {
    try {
      const response = await this.httpClient.get<any>('/api/v1/chat/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        totalSessions: response.total_sessions,
        totalMessages: response.total_messages,
        totalAiResponses: response.total_ai_responses,
      };
    } catch (error) {
      this.logger.error('Failed to get chat stats', error);
      throw error;
    }
  }

  private mapChatSessionResponse(data: any): ChatSession {
    return {
      id: data.id,
      title: data.title,
      userId: data.user_id,
      partnerUserId: data.partner_user_id,
      sessionType: data.session_type,
      status: data.status,
      topic: data.topic,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      lastActivity: new Date(data.last_activity),
    };
  }

  private mapChatSessionWithMessages(data: any): ChatSession {
    return {
      ...this.mapChatSessionResponse(data),
      messages: data.messages?.map(message => this.mapChatMessageResponse(message)) || [],
    };
  }

  private mapChatMessageResponse(data: any): ChatMessage {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      role: data.role,
      content: data.content,
      messageType: data.message_type,
      parentMessageId: data.parent_message_id,
      isEdited: data.is_edited,
      isDeleted: data.is_deleted,
      tokensUsed: data.tokens_used,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      session: null, // Will be populated by resolver if needed
      suggestedActions: data.suggested_actions,
      confidenceScore: data.confidence_score,
    };
  }
}
