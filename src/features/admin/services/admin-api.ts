import { apiClient } from '@/services/api-client';
import type { UserResponse, Role, AuthResponse } from '@/features/auth/types';
import type { QueryParams } from '@/types/query';
import type { ApiResponse } from '@/features/chat/types';
import type { Entitlement, PlanTier } from '@/features/billing/services/billing-api';

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
export interface AdminAiUsageBreakdown { key: string; totalTokens: number; costVnd: number; requestCount: number; }
export interface AdminAiUsage { totalTokens: number; totalCostVnd: number; requestCount: number; trackingStartedAt?: string; daily: Array<{ date: string; totalTokens: number; costVnd: number; requestCount: number }>; byOperation: AdminAiUsageBreakdown[]; byModel: AdminAiUsageBreakdown[]; }
export interface AdminDashboard { rangeDays: number; totalUsers: number; totalSpaces: number; totalDocuments: number; documentsNeedingAttention: number; activity: Array<{ date: string; users: number; spaces: number; documents: number }>; documentStatusCounts: Record<DocumentStatus, number>; failedDocuments: AdminDocumentSummary[]; recentSpaces: AdminSpaceSummary[]; aiUsage: AdminAiUsage; }
export interface AiModelPrice { inputPerMillionUsd: number; cachedInputPerMillionUsd: number; outputPerMillionUsd: number; }
export interface AdminAiSettings { apiKeyConfigured: boolean; keyFingerprint?: string; benchmarkApiKeyConfigured: boolean; benchmarkKeyFingerprint?: string; chatModel: string; parserModel: string; embeddingModel: string; benchmarkJudgeModel: string; benchmarkJudgeEmbeddingModel: string; vndPerUsd: number; pricingVersion: string; modelPrices: Record<string, AiModelPrice>; updatedAt?: string; }
export interface AdminAiSettingsUpdate extends Omit<AdminAiSettings, 'apiKeyConfigured' | 'keyFingerprint' | 'benchmarkApiKeyConfigured' | 'benchmarkKeyFingerprint' | 'updatedAt'> { apiKey?: string; benchmarkApiKey?: string; }
export interface AiSettingsChange {
  group: 'CHAT' | 'BENCHMARK' | 'PRICING';
  field: string;
  model: string | null;
  before: string | null;
  after: string | null;
}
export interface AiSettingsHistoryEntry {
  id: number;
  savedAt: string;
  actorId: number;
  actorName: string;
  changes: AiSettingsChange[];
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
  updateUserPlan: async (id: number, plan: PlanTier): Promise<Entitlement> => (await apiClient.patch<ApiResponse<Entitlement>>(`/admin/users/${id}/plan`, { plan })).data.result,

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
  getAiSettings: async (): Promise<AdminAiSettings> => (await apiClient.get<ApiResponse<AdminAiSettings>>('/admin/ai-settings')).data.result,
  getAiSettingsHistory: async (page: number): Promise<PageResponse<AiSettingsHistoryEntry>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AiSettingsHistoryEntry>>>('/admin/ai-settings/history', { params: { page } });
    return response.data.result;
  },
  updateAiSettings: async (data: AdminAiSettingsUpdate): Promise<AdminAiSettings> => (await apiClient.put<ApiResponse<AdminAiSettings>>('/admin/ai-settings', data)).data.result,
};
