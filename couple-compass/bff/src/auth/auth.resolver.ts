import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput, SignupInput } from './dto/auth.input';
import { AuthPayload, User } from '../users/entities/user.entity';

@Resolver('Auth')
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('input') loginInput: LoginInput): Promise<AuthPayload> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthPayload)
  async signup(@Args('input') signupInput: SignupInput): Promise<AuthPayload> {
    return this.authService.signup(signupInput);
  }

  @Mutation(() => AuthPayload)
  async refreshToken(@Args('refreshToken') refreshToken: string): Promise<AuthPayload> {
    return this.authService.refreshToken(refreshToken);
  }

  @Query(() => User)
  async me(@Context() context: any): Promise<User> {
    const token = this.extractTokenFromContext(context);
    if (!token) {
      throw new Error('Authentication required');
    }
    return this.authService.getCurrentUser(token);
  }

  private extractTokenFromContext(context: any): string | null {
    const authHeader = context.req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }
}
