import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('PORT', 4000);
  }

  get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', 'development-jwt-secret');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  get backendUrl(): string {
    return this.configService.get<string>('BACKEND_URL', 'http://localhost:8000');
  }

  get allowedOrigins(): string[] {
    const origins = this.configService.get<string>(
      'ALLOWED_ORIGINS', 
      'http://localhost:3000,http://localhost:3001'
    );
    return origins.split(',').map(origin => origin.trim());
  }
}
