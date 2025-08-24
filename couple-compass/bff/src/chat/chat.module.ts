import { Module } from '@nestjs/common';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { HttpClientService } from '../shared/services/http-client.service';

@Module({
  providers: [ChatResolver, ChatService, HttpClientService],
  exports: [ChatService],
})
export class ChatModule {}
