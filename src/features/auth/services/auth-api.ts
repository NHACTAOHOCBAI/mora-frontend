import { apiClient } from '@/services/api-client';
import type { AuthResponse, UserResponse } from '../types';
import type { ApiResponse } from '@/features/chat/types';

export const authApi = {
  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post("/auth/forgot-password", { email });
  },
  resetPassword: async (data: { token: string; newPassword: string }): Promise<void> => {
    await apiClient.post("/auth/reset-password", data);
  },
  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.result;
  },

  register: async (data: { email: string; fullName: string; password: string }): Promise<UserResponse> => {
    const response = await apiClient.post<ApiResponse<UserResponse>>('/auth/register', data);
    return response.data.result;
  },

  getCurrentUser: async (signal?: AbortSignal): Promise<UserResponse> => {
    const response = await apiClient.get<ApiResponse<UserResponse>>('/users/me', { signal });
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
