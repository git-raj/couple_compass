import { AuthService } from './auth.service';
import { LoginInput, SignupInput } from './dto/auth.input';
import { AuthPayload, User } from '../users/entities/user.entity';
export declare class AuthResolver {
    private authService;
    constructor(authService: AuthService);
    login(loginInput: LoginInput): Promise<AuthPayload>;
    signup(signupInput: SignupInput): Promise<AuthPayload>;
    refreshToken(refreshToken: string): Promise<AuthPayload>;
    me(context: any): Promise<User>;
    private extractTokenFromContext;
}
