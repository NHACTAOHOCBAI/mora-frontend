import { apiClient } from '@/services/api-client';
import type { AuthResponse, UserResponse } from '../types';
import type { ApiResponse } from '@/features/chat/types';

export const authApi = {
  login: async (data: Record<string, string>): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.result;
  },

  register: async (data: Record<string, string>): Promise<UserResponse> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/auth/register', data);
    return response.data.result;
  },

  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me');
    return response.data.result;
  },
};
