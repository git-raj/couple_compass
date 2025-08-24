import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  password: string;
}

@InputType()
export class SignupInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;

  @Field()
  @IsString()
  @MinLength(1)
  name: string;
}

@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  pronouns?: string;

  @Field({ nullable: true })
  @IsString()
  birthdate?: string;

  @Field({ nullable: true })
  @IsString()
  timezone?: string;

  @Field({ nullable: true })
  @IsString()
  relationship_status?: string;

  @Field({ nullable: true })
  @IsString()
  partner_name?: string;

  @Field({ nullable: true })
  @IsString()
  anniversary_date?: string;
}
