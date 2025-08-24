import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private configService;
    constructor(configService: NestConfigService);
    get port(): number;
    get isProduction(): boolean;
    get jwtSecret(): string;
    get jwtExpiresIn(): string;
    get redisHost(): string;
    get redisPort(): number;
    get redisPassword(): string;
    get backendUrl(): string;
    get allowedOrigins(): string[];
}
