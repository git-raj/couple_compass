export declare class User {
    id: string;
    name: string;
    email: string;
    is_active: boolean;
    is_verified: boolean;
    auth_provider?: string;
    pronouns?: string;
    birthdate?: string;
    timezone: string;
    relationship_status?: string;
    partner_name?: string;
    anniversary_date?: string;
    onboarding_completed: boolean;
    created_at: Date;
    updated_at?: Date;
}
export declare class AuthPayload {
    access_token: string;
    token_type: string;
    user: User;
}
