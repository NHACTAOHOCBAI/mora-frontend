import { apiClient } from '@/services/api-client';
import type { UserResponse, Role } from '@/features/auth/types';

export interface AdminUserUpdateRequest {
  active: boolean;
  role: Role;
}

export const adminApi = {
  getAllUsers: async (): Promise<UserResponse[]> => {
    const response = await apiClient.get<UserResponse[]>('/admin/users');
    return response.data;
  },

  updateUser: async (id: number, data: AdminUserUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<UserResponse>(`/admin/users/${id}`, data);
    return response.data;
  },
};
