import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  Subscription,
  Int,
} from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { ChatService } from './chat.service';
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

const pubSub = new PubSub();

@Resolver(() => ChatSession)
export class ChatResolver {
  private readonly logger = new Logger(ChatResolver.name);

  constructor(private readonly chatService: ChatService) {}

  @Query(() => [ChatSession])
  async chatSessions(
    @Args('input', { nullable: true }) input?: ChatSessionsInput,
    @Context() context?: any,
  ): Promise<ChatSession[]> {
    const token = this.extractTokenFromContext(context);
    const sessionInput = input || { limit: 20, offset: 0 };
    
    try {
      return await this.chatService.getChatSessions(sessionInput, token);
    } catch (error) {
      this.logger.error('Error fetching chat sessions', error);
      throw error;
    }
  }

  @Query(() => ChatSession)
  async chatSession(
    @Args('sessionId', { type: () => Int }) sessionId: number,
    @Context() context: any,
  ): Promise<ChatSession> {
    const token = this.extractTokenFromContext(context);
    
    try {
      return await this.chatService.getChatSession(sessionId, token);
    } catch (error) {
      this.logger.error(`Error fetching chat session ${sessionId}`, error);
      throw error;
    }
  }

  @Query(() => [ChatMessage])
  async chatHistory(
    @Args('input') input: ChatHistoryInput,
    @Context() context: any,
  ): Promise<ChatMessage[]> {
    const token = this.extractTokenFromContext(context);
    
    try {
      return await this.chatService.getChatHistory(input, token);
    } catch (error) {
      this.logger.error('Error fetching chat history', error);
      throw error;
    }
  }

  @Query(() => ChatStats)
  async chatStats(@Context() context: any): Promise<ChatStats> {
    const token = this.extractTokenFromContext(context);
    
    try {
      return await this.chatService.getChatStats(token);
    } catch (error) {
      this.logger.error('Error fetching chat stats', error);
      throw error;
    }
  }

  @Mutation(() => ChatSession)
  async createChatSession(
    @Args('input') input: CreateChatSessionInput,
    @Context() context: any,
  ): Promise<ChatSession> {
    const token = this.extractTokenFromContext(context);
    
    try {
      const session = await this.chatService.createChatSession(input, token);
      
      // Publish session created event
      pubSub.publish('chatSessionCreated', {
        chatSessionCreated: session,
      });
      
      return session;
    } catch (error) {
      this.logger.error('Error creating chat session', error);
      throw error;
    }
  }

  @Mutation(() => ChatResponse)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @Context() context: any,
  ): Promise<ChatResponse> {
    const token = this.extractTokenFromContext(context);
    
    try {
      const response = await this.chatService.sendMessage(input, token);
      
      // Publish message sent event for real-time updates
      pubSub.publish(`chatMessage_${input.sessionId}`, {
        chatMessageReceived: response.aiResponse,
      });
      
      return response;
    } catch (error) {
      this.logger.error('Error sending message', error);
      throw error;
    }
  }

  @Mutation(() => ChatSession)
  async updateSessionTitle(
    @Args('input') input: UpdateSessionTitleInput,
    @Context() context: any,
  ): Promise<ChatSession> {
    const token = this.extractTokenFromContext(context);
    
    try {
      const updatedSession = await this.chatService.updateSessionTitle(input, token);
      
      // Publish session updated event
      pubSub.publish('chatSessionUpdated', {
        chatSessionUpdated: updatedSession,
      });
      
      return updatedSession;
    } catch (error) {
      this.logger.error('Error updating session title', error);
      throw error;
    }
  }

  @Mutation(() => Boolean)
  async deleteChatSession(
    @Args('sessionId', { type: () => Int }) sessionId: number,
    @Context() context: any,
  ): Promise<boolean> {
    const token = this.extractTokenFromContext(context);
    
    try {
      const result = await this.chatService.deleteChatSession(sessionId, token);
      
      if (result) {
        // Publish session deleted event
        pubSub.publish('chatSessionDeleted', {
          chatSessionDeleted: sessionId,
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error deleting chat session ${sessionId}`, error);
      throw error;
    }
  }

  @Mutation(() => String)
  async generateSessionSummary(
    @Args('sessionId', { type: () => Int }) sessionId: number,
    @Context() context: any,
  ): Promise<string> {
    const token = this.extractTokenFromContext(context);
    
    try {
      return await this.chatService.generateSessionSummary(sessionId, token);
    } catch (error) {
      this.logger.error(`Error generating session summary for ${sessionId}`, error);
      throw error;
    }
  }

  // Real-time subscriptions
  @Subscription(() => ChatMessage, {
    filter: (payload, variables) => {
      return payload.chatMessageReceived.sessionId === variables.sessionId;
    },
  })
  chatMessageReceived(
    @Args('sessionId', { type: () => Int }) sessionId: number,
  ) {
    return pubSub.asyncIterator(`chatMessage_${sessionId}`);
  }

  @Subscription(() => ChatSession)
  chatSessionCreated() {
    return pubSub.asyncIterator('chatSessionCreated');
  }

  @Subscription(() => ChatSession)
  chatSessionUpdated() {
    return pubSub.asyncIterator('chatSessionUpdated');
  }

  @Subscription(() => Int)
  chatSessionDeleted() {
    return pubSub.asyncIterator('chatSessionDeleted');
  }

  // Typing indicator subscription
  @Subscription(() => Boolean, {
    filter: (payload, variables) => {
      return payload.userTyping.sessionId === variables.sessionId;
    },
  })
  userTyping(
    @Args('sessionId', { type: () => Int }) sessionId: number,
  ) {
    return pubSub.asyncIterator(`typing_${sessionId}`);
  }

  // Mutation to publish typing events
  @Mutation(() => Boolean)
  async publishTypingIndicator(
    @Args('sessionId', { type: () => Int }) sessionId: number,
    @Args('isTyping') isTyping: boolean,
    @Context() context: any,
  ): Promise<boolean> {
    try {
      // Publish typing indicator
      pubSub.publish(`typing_${sessionId}`, {
        userTyping: {
          sessionId,
          isTyping,
        },
      });
      
      return true;
    } catch (error) {
      this.logger.error('Error publishing typing indicator', error);
      return false;
    }
  }

  private extractTokenFromContext(context: any): string {
    if (!context?.req?.headers?.authorization) {
      throw new Error('Authorization token is required');
    }

    const authHeader = context.req.headers.authorization;
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization format');
    }

    return authHeader.replace('Bearer ', '');
  }
}
