import { HttpClientService } from '../shared/services/http-client.service';
import { LoginInput, SignupInput } from './dto/auth.input';
import { AuthPayload, User } from '../users/entities/user.entity';
export declare class AuthService {
    private httpClient;
    constructor(httpClient: HttpClientService);
    login(loginInput: LoginInput): Promise<AuthPayload>;
    signup(signupInput: SignupInput): Promise<AuthPayload>;
    getCurrentUser(token: string): Promise<User>;
    refreshToken(refreshToken: string): Promise<AuthPayload>;
}
