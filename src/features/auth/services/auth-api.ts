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

  updateProfile: async (data: { fullName: string }): Promise<UserResponse> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>('/users/profile', data);
    return response.data.result;
  },

  uploadAvatar: async (file: File): Promise<UserResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ApiResponse<UserResponse>>('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.result;
  },

  changePassword: async (data: Record<string, string>): Promise<void> => {
    await apiClient.put<ApiResponse<void>>('/users/profile/password', data);
  },
};
