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
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
}
