import { apiClient } from '@/services/api-client';
import type { UserResponse, Role, AuthResponse } from '@/features/auth/types';
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

export type DocumentStatus = 'UPLOADING' | 'PARSING' | 'INDEXING' | 'READY' | 'FAILED';
export interface AdminSpaceSummary { id: number; name: string; ownerName: string; memberCount: number; documentCount: number; createdAt: string; lastActivityAt?: string; }
export interface AdminDocumentSummary { id: number; name: string; status: DocumentStatus; spaceId: number; spaceName: string; uploadedById?: number; uploadedByName: string; fileSize?: number; contentType?: string; createdAt: string; updatedAt?: string; failureCode?: string; failureMessage?: string; failedAt?: string; }
export interface AdminMemberSummary { userId: number; fullName: string; email: string; avatarUrl?: string; role: string; joinedAt: string; }
export interface AdminSpaceDetail { space: AdminSpaceSummary; description?: string; members: AdminMemberSummary[]; documents: AdminDocumentSummary[]; }
export interface AdminUserDetail { id: number; email: string; fullName: string; avatarUrl?: string; role: Role; active: boolean; createdAt: string; updatedAt?: string; ownedSpaces: AdminSpaceSummary[]; memberSpaces: AdminSpaceSummary[]; uploadedDocuments: AdminDocumentSummary[]; }
export interface AdminDashboard { rangeDays: number; totalUsers: number; totalSpaces: number; totalDocuments: number; documentsNeedingAttention: number; activity: Array<{ date: string; users: number; spaces: number; documents: number }>; documentStatusCounts: Record<DocumentStatus, number>; failedDocuments: AdminDocumentSummary[]; recentSpaces: AdminSpaceSummary[]; }

export const adminApi = {
  getAllUsers: async (params?: QueryParams): Promise<PageResponse<UserResponse>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<UserResponse>>>('/admin/users', { params });
    return response.data.result;
  },

  updateUser: async (id: number, data: AdminUserUpdateRequest): Promise<UserResponse> => {
    const response = await apiClient.put<ApiResponse<UserResponse>>(`/admin/users/${id}`, data);
    return response.data.result;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
  },

  impersonateUser: async (id: number): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(`/admin/users/${id}/impersonate`);
    return response.data.result;
  },
  getDashboard: async (range = 30): Promise<AdminDashboard> => (await apiClient.get<ApiResponse<AdminDashboard>>('/admin/dashboard', { params: { range } })).data.result,
  getSpaces: async (params?: QueryParams): Promise<PageResponse<AdminSpaceSummary>> => (await apiClient.get<ApiResponse<PageResponse<AdminSpaceSummary>>>('/admin/spaces', { params })).data.result,
  getSpace: async (id: number): Promise<AdminSpaceDetail> => (await apiClient.get<ApiResponse<AdminSpaceDetail>>(`/admin/spaces/${id}`)).data.result,
  getDocuments: async (params?: QueryParams & { status?: DocumentStatus }): Promise<PageResponse<AdminDocumentSummary>> => (await apiClient.get<ApiResponse<PageResponse<AdminDocumentSummary>>>('/admin/documents', { params })).data.result,
  getDocument: async (id: number): Promise<AdminDocumentSummary> => (await apiClient.get<ApiResponse<AdminDocumentSummary>>(`/admin/documents/${id}`)).data.result,
  getUser: async (id: number): Promise<AdminUserDetail> => (await apiClient.get<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`)).data.result,
};
