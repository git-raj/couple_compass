import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

@InputType()
export class CreateChatSessionInput {
  @Field()
  @IsString()
  @MaxLength(255)
  title: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  partnerUserId?: number;

  @Field({ defaultValue: 'ai_mediation' })
  @IsString()
  sessionType: string = 'ai_mediation';

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  topic?: string;
}

@InputType()
export class SendMessageInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  sessionId: number;

  @Field()
  @IsString()
  content: string;

  @Field({ defaultValue: 'text' })
  @IsString()
  messageType: string = 'text';

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  parentMessageId?: number;
}

@InputType()
export class UpdateSessionTitleInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  sessionId: number;

  @Field()
  @IsString()
  @MaxLength(255)
  title: string;
}

@InputType()
export class ChatHistoryInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  sessionId: number;

  @Field(() => Int, { defaultValue: 50 })
  @IsInt()
  @Min(1)
  limit: number = 50;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  offset: number = 0;
}

@InputType()
export class ChatSessionsInput {
  @Field(() => Int, { defaultValue: 20 })
  @IsInt()
  @Min(1)
  limit: number = 20;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  offset: number = 0;
}
