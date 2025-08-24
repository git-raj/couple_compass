import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { HttpClientService } from '../shared/services/http-client.service';
import { ConfigService } from '../config/config.service';

@Module({
  providers: [AuthService, AuthResolver, HttpClientService, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}
