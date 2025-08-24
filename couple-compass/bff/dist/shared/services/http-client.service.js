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
exports.HttpClientService = void 0;
const common_1 = require("@nestjs/common");
const config_service_1 = require("../../config/config.service");
const axios_1 = require("axios");
let HttpClientService = class HttpClientService {
    constructor(configService) {
        this.configService = configService;
        this.client = axios_1.default.create({
            baseURL: this.configService.backendUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.client.interceptors.request.use((config) => {
            config.headers['X-Request-ID'] = this.generateRequestId();
            return config;
        }, (error) => Promise.reject(error));
        this.client.interceptors.response.use((response) => response, (error) => {
            const status = error.response?.status || 500;
            const message = error.response?.data?.detail || error.response?.data?.message || 'Internal server error';
            throw new common_1.HttpException(message, status);
        });
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
    withAuth(token) {
        return axios_1.default.create({
            ...this.client.defaults,
            headers: {
                ...this.client.defaults.headers,
                Authorization: `Bearer ${token}`,
            },
        });
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
};
exports.HttpClientService = HttpClientService;
exports.HttpClientService = HttpClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], HttpClientService);
//# sourceMappingURL=http-client.service.js.map