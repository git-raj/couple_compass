import { ConfigService } from '../../config/config.service';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
export declare class HttpClientService {
    private configService;
    private readonly client;
    constructor(configService: ConfigService);
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    withAuth(token: string): AxiosInstance;
    private generateRequestId;
}
