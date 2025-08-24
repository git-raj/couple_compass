# Couple Compass - BFF (Backend for Frontend) Build Guide

mv Couple_Compass poc_couple_comp
cd poc_couple_comp



## Overview

This document provides comprehensive guidance for building the BFF (Backend for Frontend) layer for Couple Compass. The BFF acts as an API gateway and data aggregation layer, optimizing API interactions for different client applications while providing caching, rate limiting, and client-specific data transformations.

## Architecture Pattern

The BFF pattern sits between the frontend applications and backend microservices, providing:
- **Client-Specific APIs**: Tailored endpoints for mobile and web clients
- **Data Aggregation**: Combining multiple backend calls into single requests
- **Caching Layer**: Intelligent caching for improved performance
- **Security Gateway**: Authentication, authorization, and request validation
- **Protocol Translation**: REST to GraphQL conversion when needed
- **Real-time Features**: WebSocket connections for live updates

```
┌─────────────┐    ┌─────────────────┐    ┌──────────────────┐
│   Mobile    │    │                 │    │                  │
│   Client    │◄──►│       BFF       │◄──►│  Backend         │
│             │    │   (API Gateway) │    │  Microservices   │
└─────────────┘    │                 │    │                  │
                   │                 │    └──────────────────┘
┌─────────────┐    │                 │    
│    Web      │◄──►│                 │    ┌──────────────────┐
│   Client    │    │                 │◄──►│   External       │
│             │    │                 │    │   Services       │
└─────────────┘    └─────────────────┘    └──────────────────┘
```

## Technology Stack

### Primary Options

#### Option 1: NestJS + GraphQL (Recommended)
- **Framework**: NestJS 10+ with GraphQL
- **GraphQL**: Apollo Server + Code-First approach
- **Caching**: Redis with GraphQL response caching
- **Real-time**: GraphQL subscriptions + WebSocket
- **Validation**: class-validator + GraphQL scalars
- **Authentication**: JWT + GraphQL shields

#### Option 2: Express.js + REST
- **Framework**: Express.js 4+ with TypeScript
- **API Style**: RESTful APIs with OpenAPI
- **Caching**: Redis with custom middleware
- **Real-time**: Socket.io
- **Validation**: joi or express-validator
- **Authentication**: JWT middleware

#### Option 3: FastAPI (Python)
- **Framework**: FastAPI for rapid development
- **API Style**: REST with automatic OpenAPI
- **Caching**: Redis with fastapi-cache
- **Real-time**: FastAPI WebSockets
- **Validation**: Pydantic models
- **Authentication**: JWT dependencies

## Project Structure (NestJS + GraphQL)

```
bff/
├── src/
│   ├── app.module.ts               # Main application module
│   ├── main.ts                     # Application entry point
│   ├── config/                     # Configuration management
│   │   ├── config.module.ts
│   │   ├── config.service.ts
│   │   └── validation.schema.ts
│   ├── auth/                       # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.resolver.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/                      # User management
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.resolver.ts
│   │   ├── dto/
│   │   │   ├── create-user.input.ts
│   │   │   └── update-user.input.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── couples/                    # Couple management
│   │   ├── couples.module.ts
│   │   ├── couples.service.ts
│   │   ├── couples.resolver.ts
│   │   └── dto/
│   ├── quizzes/                    # Quiz functionality
│   │   ├── quizzes.module.ts
│   │   ├── quizzes.service.ts
│   │   ├── quizzes.resolver.ts
│   │   └── dto/
│   ├── dashboard/                  # Dashboard aggregations
│   │   ├── dashboard.module.ts
│   │   ├── dashboard.service.ts
│   │   ├── dashboard.resolver.ts
│   │   └── dto/
│   ├── shared/                     # Shared utilities
│   │   ├── services/
│   │   │   ├── http-client.service.ts
│   │   │   ├── cache.service.ts
│   │   │   └── websocket.service.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── cache.decorator.ts
│   │   ├── guards/
│   │   │   └── throttle.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── cache.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   └── filters/
│   │       └── all-exceptions.filter.ts
│   ├── websocket/                  # WebSocket gateway
│   │   ├── websocket.module.ts
│   │   ├── websocket.gateway.ts
│   │   └── dto/
│   └── generated/                  # Generated GraphQL types
├── test/                          # E2E tests
├── package.json
├── tsconfig.json
├── nest-cli.json
├── schema.gql                     # Generated GraphQL schema
├── Dockerfile
└── docker-compose.yml
```

## GraphQL Schema Design

### Core Types
```graphql
# schema.gql
scalar DateTime
scalar JSON
scalar Upload

type User {
  id: ID!
  email: String!
  profile: Profile
  couples: [Couple!]!
  createdAt: DateTime!
  updatedAt: DateTime
}

type Profile {
  id: ID!
  userId: ID!
  name: String!
  avatarUrl: String
  pronouns: String
  birthdate: DateTime
  timezone: String!
  onboardingCompleted: Boolean!
  user: User!
}

type Couple {
  id: ID!
  status: CoupleStatus!
  createdAt: DateTime!
  members: [CoupleMember!]!
  recentActivity: [Activity!]!
  stats: CoupleStats!
}

type CoupleMember {
  id: ID!
  userId: ID!
  coupleId: ID!
  role: CoupleRole!
  joinedAt: DateTime!
  user: User!
}

type CoupleStats {
  totalMoodCheckins: Int!
  averageMood: Float!
  journalEntries: Int!
  quizzesCompleted: Int!
  currentStreak: Int!
  longestStreak: Int!
}

enum CoupleStatus {
  ACTIVE
  PAUSED
  ENDED
}

enum CoupleRole {
  PARTNER
  ADMIN
}

type Quiz {
  id: ID!
  slug: String!
  title: String!
  description: String
  type: QuizType!
  isActive: Boolean!
  items: [QuizItem!]!
  userResult: QuizResult
  estimatedMinutes: Int!
}

type QuizItem {
  id: ID!
  prompt: String!
  type: QuizItemType!
  options: JSON
  orderIndex: Int!
}

type QuizResult {
  id: ID!
  userId: ID!
  quizId: ID!
  responses: JSON!
  scores: JSON!
  completedAt: DateTime!
  quiz: Quiz!
}

enum QuizType {
  LOVE_LANGUAGE
  COMMUNICATION_STYLE
  CONFLICT_RESOLUTION
}

enum QuizItemType {
  MULTIPLE_CHOICE
  SCALE
  TEXT
}

type MoodCheckin {
  id: ID!
  userId: ID!
  coupleId: ID!
  moodLevel: Int!
  notes: String
  contextTags: [String!]
  createdAt: DateTime!
  user: User!
}

type Journal {
  id: ID!
  userId: ID!
  coupleId: ID!
  content: String!
  visibility: JournalVisibility!
  sentimentScore: Int
  themes: [String!]
  createdAt: DateTime!
  user: User!
}

enum JournalVisibility {
  PRIVATE
  SHARED
}

type Tip {
  id: ID!
  title: String!
  content: String!
  category: String!
  tags: [String!]!
  priority: Int!
}

type UserTip {
  id: ID!
  tipId: ID!
  context: JSON!
  status: TipStatus!
  viewedAt: DateTime
  createdAt: DateTime!
  tip: Tip!
}

enum TipStatus {
  SUGGESTED
  VIEWED
  DISMISSED
  HELPFUL
}

type DashboardData {
  user: User!
  couple: Couple
  recentMoods: [MoodCheckin!]!
  suggestedTips: [UserTip!]!
  streakInfo: StreakInfo!
  weeklyStats: WeeklyStats!
  upcomingReminders: [Reminder!]!
}

type StreakInfo {
  current: Int!
  longest: Int!
  type: String!
  lastActivity: DateTime
}

type WeeklyStats {
  averageMood: Float!
  journalEntries: Int!
  communicationScore: Int!
  goalsCompleted: Int!
}

type Reminder {
  id: ID!
  type: String!
  title: String!
  message: String!
  scheduledFor: DateTime!
}

type Activity {
  id: ID!
  type: ActivityType!
  userId: ID!
  coupleId: ID!
  data: JSON!
  createdAt: DateTime!
  user: User!
}

enum ActivityType {
  MOOD_CHECKIN
  JOURNAL_ENTRY
  QUIZ_COMPLETED
  TIP_VIEWED
  MILESTONE_REACHED
}

# Subscription types for real-time updates
type Subscription {
  coupleActivityUpdated(coupleId: ID!): Activity!
  newTipSuggested(userId: ID!): UserTip!
  moodCheckinAdded(coupleId: ID!): MoodCheckin!
}

# Query root
type Query {
  # User queries
  me: User!
  user(id: ID!): User
  
  # Couple queries
  myCouple: Couple
  couple(id: ID!): Couple
  
  # Quiz queries
  quizzes: [Quiz!]!
  quiz(slug: String!): Quiz
  myQuizResults: [QuizResult!]!
  
  # Dashboard
  dashboard: DashboardData!
  
  # Tips
  suggestedTips: [UserTip!]!
  tip(id: ID!): Tip
  
  # Mood & Journal
  recentMoods(limit: Int = 10): [MoodCheckin!]!
  journalEntries(limit: Int = 10): [Journal!]!
}

# Mutation root
type Mutation {
  # Authentication
  login(input: LoginInput!): AuthPayload!
  signup(input: SignupInput!): AuthPayload!
  refreshToken(refreshToken: String!): AuthPayload!
  
  # Profile
  updateProfile(input: UpdateProfileInput!): Profile!
  uploadAvatar(file: Upload!): String!
  
  # Couple management
  createPartnerLink: PartnerLink!
  joinCouple(linkCode: String!): Couple!
  leaveCouple: Boolean!
  
  # Quiz
  submitQuizResult(input: SubmitQuizResultInput!): QuizResult!
  
  # Mood & Journal
  createMoodCheckin(input: CreateMoodCheckinInput!): MoodCheckin!
  createJournal(input: CreateJournalInput!): Journal!
  updateJournal(id: ID!, input: UpdateJournalInput!): Journal!
  deleteJournal(id: ID!): Boolean!
  
  # Tips
  markTipAsViewed(tipId: ID!): UserTip!
  markTipAsHelpful(tipId: ID!): UserTip!
  dismissTip(tipId: ID!): UserTip!
}
```

## NestJS Implementation

### Main Application Module
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CouplesModule } from './couples/couples.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WebSocketModule } from './websocket/websocket.module';
import { SharedModule } from './shared/shared.module';
import { ConfigService } from './config/config.service';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    
    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: 'schema.gql',
        sortSchema: true,
        playground: configService.isProduction ? false : true,
        introspection: !configService.isProduction,
        subscriptions: {
          'graphql-ws': true,
          'subscriptions-transport-ws': true,
        },
        context: ({ req, connection, extra }) => {
          if (connection) {
            return { req: connection.context };
          }
          return { req };
        },
        formatError: (error) => ({
          message: error.message,
          code: error.extensions?.code,
          path: error.path,
        }),
      }),
      inject: [ConfigService],
    }),
    
    // Caching
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        host: configService.redisHost,
        port: configService.redisPort,
        password: configService.redisPassword,
        ttl: 300, // 5 minutes default
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000, // 1 second
            limit: 10,
          },
          {
            name: 'medium',
            ttl: 10000, // 10 seconds
            limit: 20,
          },
          {
            name: 'long',
            ttl: 60000, // 1 minute
            limit: 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    
    // Application modules
    SharedModule,
    AuthModule,
    UsersModule,
    CouplesModule,
    QuizzesModule,
    DashboardModule,
    WebSocketModule,
  ],
})
export class AppModule {}
```

### Configuration Service
```typescript
// src/config/config.service.ts
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
    return this.configService.get<string>('JWT_SECRET');
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
    const origins = this.configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000');
    return origins.split(',').map(origin => origin.trim());
  }
}
```

### HTTP Client Service
```typescript
// src/shared/services/http-client.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class HttpClientService {
  private readonly client: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.configService.backendUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for adding auth headers
    this.client.interceptors.request.use(
      (config) => {
        // Add request ID for tracing
        config.headers['X-Request-ID'] = this.generateRequestId();
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Internal server error';
        
        throw new HttpException(message, status);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  withAuth(token: string): AxiosInstance {
    return axios.create({
      ...this.client.defaults,
      headers: {
        ...this.client.defaults.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
```

### Authentication Resolver
```typescript
// src/auth/auth.resolver.ts
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginInput, SignupInput, AuthPayload } from './dto/auth.dto';

@Resolver('Auth')
@UseGuards(ThrottlerGuard)
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
}

// src/auth/dto/auth.dto.ts
import { InputType, ObjectType, Field } from '@nestjs/graphql';
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

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field()
  tokenType: string;

  @Field()
  expiresIn: number;
}
```

### Dashboard Service with Data Aggregation
```typescript
// src/dashboard/dashboard.service.ts
import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { HttpClientService } from '../shared/services/http-client.service';
import { DashboardData, User } from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private httpClient: HttpClientService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDashboardData(user: User, authToken: string): Promise<DashboardData> {
    const cacheKey = `dashboard:${user.id}`;
    
    // Try to get from cache first
    const cached = await this.cacheManager.get<DashboardData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Aggregate data from multiple backend services
    const client = this.httpClient.withAuth(authToken);

    const [
      coupleData,
      recentMoods,
      suggestedTips,
      streakInfo,
      weeklyStats,
      reminders,
    ] = await Promise.all([
      this.getCoupleData(client, user.id),
      this.getRecentMoods(client, user.id),
      this.getSuggestedTips(client, user.id),
      this.getStreakInfo(client, user.id),
      this.getWeeklyStats(client, user.id),
      this.getReminders(client, user.id),
    ]);

    const dashboardData: DashboardData = {
      user,
      couple: coupleData,
      recentMoods,
      suggestedTips,
      streakInfo,
      weeklyStats,
      upcomingReminders: reminders,
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, dashboardData, 300000);

    return dashboardData;
  }

  private async getCoupleData(client: any, userId: string) {
    try {
      return await client.get(`/api/v1/couples/me`);
    } catch (error) {
      // User might not be in a couple yet
      return null;
    }
  }

  private async getRecentMoods(client: any, userId: string) {
    try {
      return await client.get(`/api/v1/moods?limit=7`);
    } catch (error) {
      return [];
    }
  }

  private async getSuggestedTips(client: any, userId: string) {
    try {
      return await client.get(`/api/v1/tips/suggested?limit=3`);
    } catch (error) {
      return [];
    }
  }

  private async getStreakInfo(client: any, userId: string) {
    try {
      return await client.get(`/api/v1/users/streak`);
    } catch (error) {
      return { current: 0, longest: 0, type: 'mood_checkin' };
    }
  }

  private async getWeeklyStats(client: any, userId: string) {
    try {
      return await client.get(`/api/v1/analytics/weekly`);
    } catch (error) {
      return {
        averageMood: 3.0,
        journalEntries: 0,
        communicationScore: 0,
        goalsCompleted: 0,
      };
    }
  }

  private async getReminders(client: any, userId: string) {
    try {
      return await client.get(`/api/v1/reminders/upcoming?limit=5`);
    } catch (error) {
      return [];
    }
  }

  async invalidateDashboardCache(userId: string): Promise<void> {
    const cacheKey = `dashboard:${userId}`;
    await this.cacheManager.del(cacheKey);
  }
}
```

### WebSocket Gateway for Real-time Features
```typescript
// src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/couples',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>(); // userId -> socketIds
  private coupleRooms = new Map<string, Set<string>>(); // coupleId -> userIds

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removeClientFromMaps(client.id);
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @CurrentUser() user: User,
    @MessageBody() data: { coupleId?: string },
  ) {
    // Add user to socket mapping
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set());
    }
    this.userSockets.get(user.id).add(client.id);

    // Join couple room if provided
    if (data.coupleId) {
      client.join(`couple:${data.coupleId}`);
      
      if (!this.coupleRooms.has(data.coupleId)) {
        this.coupleRooms.set(data.coupleId, new Set());
      }
      this.coupleRooms.get(data.coupleId).add(user.id);

      // Notify partner of user coming online
      client.to(`couple:${data.coupleId}`).emit('user_online', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }

    client.emit('joined', { success: true });
  }

  @UseGuards(JwtAuthGuard)
  @SubscribeMessage('leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @CurrentUser() user: User,
    @MessageBody() data: { coupleId?: string },
  ) {
    if (data.coupleId) {
      client.leave(`couple:${data.coupleId}`);
      
      // Notify partner of user going offline
      client.to(`couple:${data.coupleId}`).emit('user_offline', {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Methods for backend services to emit events
  async emitToCouple(coupleId: string, event: string, data: any) {
    this.server.to(`couple:${coupleId}`).emit(event, data);
  }

  async emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }

  private removeClientFromMaps(clientId: string) {
    // Remove from user sockets
    this.userSockets.forEach((sockets, userId) => {
      sockets.delete(clientId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    });
  }
}
```

### Caching Decorator and Interceptor
```typescript
// src/shared/decorators/cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';
export const CACHE_TTL = 'cache_ttl';

export const CacheKey = (key: string) => SetMetadata(CACHE_KEY, key);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);

// src/shared/interceptors/cache.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  CACHE_MANAGER,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_KEY, CACHE_TTL } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    const cacheTTL = this.reflector.get<number>(CACHE_TTL, context.getHandler());

    if (!cacheKey) {
      return next.handle();
    }

    // Get user ID from context for user-specific caching
    const ctx = context.getArgByIndex(2);
    const userId = ctx?.req?.user?.id;
    const finalCacheKey = userId ? `${cacheKey}:${userId}` : cacheKey;

    // Try to get from cache
    const cachedResult = await this.cacheManager.get(finalCacheKey);
    if (cachedResult !== null && cachedResult !== undefined) {
      return of(cachedResult);
    }

    // If not in cache, execute the handler and cache the result
    return next.handle().pipe(
      tap(async (result) => {
        const ttl = cacheTTL || 300; // Default 5 minutes
        await this.cacheManager.set(finalCacheKey, result, ttl * 1000);
      }),
    );
  }
}
```

### Quiz Resolver with Caching
```typescript
// src/quizzes/quizzes.resolver.ts
import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheInterceptor } from '../shared/interceptors/cache.interceptor';
import { CacheKey, CacheTTL } from '../shared/decorators/cache.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { QuizzesService } from './quizzes.service';
import { Quiz, QuizResult } from './entities/quiz.entity';
import { SubmitQuizResultInput } from './dto/submit-quiz-result.input';
import { User } from '../users/entities/user.entity';

const pubSub = new PubSub();

@Resolver(() => Quiz)
@UseGuards(JwtAuthGuard)
export class QuizzesResolver {
  constructor(private quizzesService: QuizzesService) {}

  @Query(() => [Quiz])
  @UseInterceptors(CacheInterceptor)
  @CacheKey('active_quizzes')
  @CacheTTL(600) // 10 minutes
  async quizzes(): Promise<Quiz[]> {
    return this.quizzesService.getActiveQuizzes();
  }

  @Query(() => Quiz)
  @UseInterceptors(CacheInterceptor)
  @CacheKey('quiz_by_slug')
  @CacheTTL(600) // 10 minutes
  async quiz(@Args('slug') slug: string): Promise<Quiz> {
    return this.quizzesService.getQuizBySlug(slug);
  }

  @Query(() => [QuizResult])
  @UseInterceptors(CacheInterceptor)
  @CacheKey('user_quiz_results')
  @CacheTTL(300) // 5 minutes
  async myQuizResults(@CurrentUser() user: User): Promise<QuizResult[]> {
    return this.quizzesService.getUserQuizResults(user.id);
  }

  @Mutation(() => QuizResult)
  async submitQuizResult(
    @Args('input') input: SubmitQuizResultInput,
    @CurrentUser() user: User,
  ): Promise<QuizResult> {
    const result = await this.quizzesService.submitQuizResult(user.id, input);
    
    // Publish subscription event
    pubSub.publish('quizCompleted', {
      quizCompleted: result,
      userId: user.id,
    });
    
    return result;
  }

  @Subscription(() => QuizResult, {
    filter: (payload, variables, context) => {
      // Only send to the user who completed the quiz
      return payload.userId === context.req.user.id;
    },
  })
  quizCompleted() {
    return pubSub.asyncIterator('quizCompleted');
  }
}
```

### Error Handling and Logging
```typescript
// src/shared/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost } from '@nestjs/graphql';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const ctx = gqlHost.getContext();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = typeof response === 'string' ? response : (response as any).message;
      code = this.getErrorCode(status);
    }

    // Log the error
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    // Return GraphQL-formatted error
    throw new HttpException(
      {
        message,
        code,
        timestamp: new Date().toISOString(),
        path: ctx?.req?.url || gqlHost.getInfo()?.fieldName,
      },
      status,
    );
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 429:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}

// src/shared/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const ctx = gqlContext.getContext();
    
    const now = Date.now();
    const operationType = info.operation.operation;
    const operationName = info.fieldName;
    const userId = ctx.req?.user?.id;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(
          `${operationType.toUpperCase()} ${operationName} - ${duration}ms ${userId ? `(user: ${userId})` : ''}`,
        );
      }),
    );
  }
}
```

## Performance Optimization Strategies

### Query Complexity Analysis
```typescript
// src/shared/plugins/complexity.plugin.ts
import { Plugin } from '@nestjs/apollo';
import {
  ApolloServerPlugin,
  GraphQLRequestListener,
} from 'apollo-server-plugin-base';
import { GraphQLError } from 'graphql';
import {
  fieldExtensionsEstimator,
  getComplexity,
  simpleEstimator,
} from 'graphql-query-complexity';

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  requestDidStart(): GraphQLRequestListener {
    return {
      didResolveOperation({ request, document }) {
        const complexity = getComplexity({
          schema: request.schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ maximumComplexity: 1000 }),
          ],
        });

        if (complexity >= 1000) {
          throw new GraphQLError(
            `Query is too complex: ${complexity}. Maximum allowed complexity: 1000`,
            {
              extensions: {
                code: 'QUERY_TOO_COMPLEX',
                complexity,
              },
            },
          );
        }
      },
    };
  }
}
```

### DataLoader for N+1 Query Prevention
```typescript
// src/shared/services/dataloader.service.ts
import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { HttpClientService } from './http-client.service';

@Injectable({ scope: Scope.REQUEST })
export class DataLoaderService {
  private readonly loaders = new Map<string, DataLoader<any, any>>();

  constructor(private httpClient: HttpClientService) {}

  getUserLoader(authToken: string): DataLoader<string, any> {
    const key = `users:${authToken}`;
    
    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any>(
        async (userIds: string[]) => {
          const client = this.httpClient.withAuth(authToken);
          const users = await client.post('/api/v1/users/batch', { userIds });
          
          // Return users in the same order as requested IDs
          return userIds.map(id => users.find(user => user.id === id));
        },
        {
          cache: true,
          batchScheduleFn: callback => setTimeout(callback, 10), // Batch requests within 10ms
        },
      );
      
      this.loaders.set(key, loader);
    }
    
    return this.loaders.get(key);
  }

  getQuizResultsLoader(authToken: string): DataLoader<string, any[]> {
    const key = `quiz-results:${authToken}`;
    
    if (!this.loaders.has(key)) {
      const loader = new DataLoader<string, any[]>(
        async (userIds: string[]) => {
          const client = this.httpClient.withAuth(authToken);
          const results = await client.post('/api/v1/quiz-results/batch', { userIds });
          
          return userIds.map(id => results.filter(result => result.userId === id));
        },
      );
      
      this.loaders.set(key, loader);
    }
    
    return this.loaders.get(key);
  }
}
```

## Testing Strategy

### Integration Tests
```typescript
// test/auth.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GraphQL Authentication', () => {
    const signupMutation = `
      mutation Signup($input: SignupInput!) {
        signup(input: $input) {
          accessToken
          refreshToken
          tokenType
          expiresIn
        }
      }
    `;

    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          accessToken
          refreshToken
          tokenType
          expiresIn
        }
      }
    `;

    it('should signup a new user', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: 'securepassword',
              name: 'Test User',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.signup).toBeDefined();
          expect(res.body.data.signup.accessToken).toBeDefined();
          expect(res.body.data.signup.tokenType).toBe('bearer');
        });
    });

    it('should login with valid credentials', async () => {
      // First signup
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: signupMutation,
          variables: {
            input: {
              email: 'login@example.com',
              password: 'securepassword',
              name: 'Login Test',
            },
          },
        });

      // Then login
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            input: {
              email: 'login@example.com',
              password: 'securepassword',
            },
          },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.login).toBeDefined();
          expect(res.body.data.login.accessToken).toBeDefined();
        });
    });
  });
});
```

## Deployment Configuration

### Dockerfile
```dockerfile
# Multi-stage build for BFF
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs package*.json ./

USER nestjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

CMD ["node", "dist/main"]
```

### Environment Configuration
```bash
# .env.example
NODE_ENV=production
PORT=4000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m

# Redis Configuration
REDIS_HOST=redis-service
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Backend Service URLs
BACKEND_URL=http://backend-service:8000

# CORS Configuration
ALLOWED_ORIGINS=https://couple-compass.com,https://app.couple-compass.com

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
```

## Monitoring and Observability

### Prometheus Metrics
```typescript
// src/shared/services/metrics.service.ts
import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register = new client.Registry();
  
  private readonly httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly graphqlRequestDuration = new client.Histogram({
    name: 'graphql_request_duration_seconds',
    help: 'Duration of GraphQL requests in seconds',
    labelNames: ['operation', 'type'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly cacheHitCounter = new client.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_key'],
  });

  private readonly cacheMissCounter = new client.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_key'],
  });

  constructor() {
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.graphqlRequestDuration);
    this.register.registerMetric(this.cacheHitCounter);
    this.register.registerMetric(this.cacheMissCounter);
    
    // Register default metrics
    client.collectDefaultMetrics({ register: this.register });
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestDuration
      .labels(method, route, status.toString())
      .observe(duration);
  }

  recordGraphQLRequest(operation: string, type: string, duration: number) {
    this.graphqlRequestDuration
      .labels(operation, type)
      .observe(duration);
  }

  recordCacheHit(cacheKey: string) {
    this.cacheHitCounter.labels(cacheKey).inc();
  }

  recordCacheMiss(cacheKey: string) {
    this.cacheMissCounter.labels(cacheKey).inc();
  }

  getMetrics(): string {
    return this.register.metrics();
  }
}
```

This BFF build guide provides a comprehensive foundation for implementing the API gateway layer with GraphQL, real-time features, intelligent caching, and robust error handling. The architecture ensures optimal performance and developer experience while maintaining security and scalability.
