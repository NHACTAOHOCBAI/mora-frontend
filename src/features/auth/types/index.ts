export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  termsAcceptedVersion?: string;
  termsAcceptedAt?: string;
  privacyAcceptedVersion?: string;
  privacyAcceptedAt?: string;
  legalAcceptanceRequired: boolean;
  planTier?: 'FREE' | 'PRO' | 'TEAM';
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
}
