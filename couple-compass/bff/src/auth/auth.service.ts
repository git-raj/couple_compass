import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpClientService } from '../shared/services/http-client.service';
import { LoginInput, SignupInput } from './dto/auth.input';
import { AuthPayload, User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private httpClient: HttpClientService) {}

  async login(loginInput: LoginInput): Promise<AuthPayload> {
    try {
      const response: any = await this.httpClient.post('/auth/login', {
        email: loginInput.email,
        password: loginInput.password,
      });

      return {
        access_token: response.access_token,
        token_type: response.token_type,
        user: response.user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async signup(signupInput: SignupInput): Promise<AuthPayload> {
    try {
      const response: any = await this.httpClient.post('/auth/register', {
        name: signupInput.name,
        email: signupInput.email,
        password: signupInput.password,
      });

      return {
        access_token: response.access_token,
        token_type: response.token_type,
        user: {
          id: response.id,
          name: response.name,
          email: response.email,
          is_active: true,
          is_verified: false,
          timezone: 'UTC',
          onboarding_completed: false,
          created_at: new Date(),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(token: string): Promise<User> {
    try {
      const client = this.httpClient.withAuth(token);
      const response: any = await client.get('/auth/me');

      return {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        is_active: true,
        is_verified: false,
        timezone: 'UTC',
        onboarding_completed: false,
        created_at: new Date(),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthPayload> {
    try {
      const response: any = await this.httpClient.post('/auth/refresh', null, {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      return {
        access_token: response.access_token,
        token_type: response.token_type,
        user: response.user,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
