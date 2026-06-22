import { apiClient } from '@/services/api-client';
import type { UserResponse, Role } from '@/features/auth/types';
import type { QueryParams } from '@/types/query';
import type { ApiResponse } from '@/features/chat/types';

export interface AdminUserUpdateRequest {
  active: boolean;
  role: Role;
}

export interface PageResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export const adminApi = {
  getAllUsers: async (params?: QueryParams): Promise<PageResponse<UserResponse>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>('/admin/users', { params });
    return response.data.result;
  },

  updateUser: async (id: number, data: AdminUserUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/admin/users/${id}`, data);
    return response.data.result;
  },
};
