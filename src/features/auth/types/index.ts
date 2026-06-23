export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export interface UserResponse {
  id: number;
  username: string;
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
  username: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
}
