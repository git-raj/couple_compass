import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  is_active: boolean;

  @Field()
  is_verified: boolean;

  @Field({ nullable: true })
  auth_provider?: string;

  @Field({ nullable: true })
  pronouns?: string;

  @Field({ nullable: true })
  birthdate?: string;

  @Field()
  timezone: string;

  @Field({ nullable: true })
  relationship_status?: string;

  @Field({ nullable: true })
  partner_name?: string;

  @Field({ nullable: true })
  anniversary_date?: string;

  @Field()
  onboarding_completed: boolean;

  @Field()
  created_at: Date;

  @Field({ nullable: true })
  updated_at?: Date;
}

@ObjectType()
export class AuthPayload {
  @Field()
  access_token: string;

  @Field()
  token_type: string;

  @Field(() => User)
  user: User;
}
