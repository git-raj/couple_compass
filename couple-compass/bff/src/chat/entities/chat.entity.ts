import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class ChatSession {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  userId: number;

  @Field(() => Int, { nullable: true })
  partnerUserId?: number;

  @Field()
  sessionType: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  topic?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  lastActivity: Date;

  @Field(() => [ChatMessage], { nullable: true })
  messages?: ChatMessage[];
}

@ObjectType()
export class ChatMessage {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  sessionId: number;

  @Field(() => Int, { nullable: true })
  userId?: number;

  @Field()
  role: string; // user, ai, partner, system

  @Field()
  content: string;

  @Field()
  messageType: string;

  @Field(() => Int, { nullable: true })
  parentMessageId?: number;

  @Field()
  isEdited: boolean;

  @Field()
  isDeleted: boolean;

  @Field(() => Int, { nullable: true })
  tokensUsed?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => ChatSession)
  session: ChatSession;

  @Field(() => [String], { nullable: true })
  suggestedActions?: string[];

  @Field({ nullable: true })
  confidenceScore?: number;
}

@ObjectType()
export class ChatResponse {
  @Field(() => ChatMessage)
  userMessage: ChatMessage;

  @Field(() => ChatMessage)
  aiResponse: ChatMessage;

  @Field(() => [String], { nullable: true })
  suggestedActions?: string[];

  @Field({ nullable: true })
  confidenceScore?: number;
}

@ObjectType()
export class ChatStats {
  @Field(() => Int)
  totalSessions: number;

  @Field(() => Int)
  totalMessages: number;

  @Field(() => Int)
  totalAiResponses: number;
}
