"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConfigService = class ConfigService {
    constructor(configService) {
        this.configService = configService;
    }
    get port() {
        return this.configService.get('PORT', 4000);
    }
    get isProduction() {
        return this.configService.get('NODE_ENV') === 'production';
    }
    get jwtSecret() {
        return this.configService.get('JWT_SECRET', 'development-jwt-secret');
    }
    get jwtExpiresIn() {
        return this.configService.get('JWT_EXPIRES_IN', '15m');
    }
    get redisHost() {
        return this.configService.get('REDIS_HOST', 'localhost');
    }
    get redisPort() {
        return this.configService.get('REDIS_PORT', 6379);
    }
    get redisPassword() {
        return this.configService.get('REDIS_PASSWORD');
    }
    get backendUrl() {
        return this.configService.get('BACKEND_URL', 'http://localhost:8000');
    }
    get allowedOrigins() {
        const origins = this.configService.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001');
        return origins.split(',').map(origin => origin.trim());
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map