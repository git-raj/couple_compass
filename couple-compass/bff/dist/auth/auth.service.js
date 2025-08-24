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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const http_client_service_1 = require("../shared/services/http-client.service");
let AuthService = class AuthService {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async login(loginInput) {
        try {
            const response = await this.httpClient.post('/auth/login', {
                email: loginInput.email,
                password: loginInput.password,
            });
            return {
                access_token: response.access_token,
                token_type: response.token_type,
                user: response.user,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
    }
    async signup(signupInput) {
        try {
            const response = await this.httpClient.post('/auth/register', {
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
        }
        catch (error) {
            throw error;
        }
    }
    async getCurrentUser(token) {
        try {
            const client = this.httpClient.withAuth(token);
            const response = await client.get('/auth/me');
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
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    async refreshToken(refreshToken) {
        try {
            const response = await this.httpClient.post('/auth/refresh', null, {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            });
            return {
                access_token: response.access_token,
                token_type: response.token_type,
                user: response.user,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [http_client_service_1.HttpClientService])
], AuthService);
//# sourceMappingURL=auth.service.js.map