import { apiClient } from '@/services/api-client';
import type { 
  UserAiSetting, 
  UserAiSettingRequest, 
  ModelQuota, 
  TestApiKeyRequest, 
  TestApiKeyResponse 
} from '../types';

export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const aiSettingsApi = {
  getSettings: async (): Promise<UserAiSetting> => {
    const response = await apiClient.get<ApiResponse<UserAiSetting>>('/user/ai-settings');
    return response.data.result;
  },

  updateSettings: async (data: UserAiSettingRequest): Promise<UserAiSetting> => {
    const response = await apiClient.put<ApiResponse<UserAiSetting>>('/user/ai-settings', data);
    return response.data.result;
  },

  testApiKey: async (data: TestApiKeyRequest): Promise<TestApiKeyResponse> => {
    const response = await apiClient.post<ApiResponse<TestApiKeyResponse>>('/user/ai-settings/test', data);
    return response.data.result;
  },

  getDailyQuota: async (): Promise<ModelQuota[]> => {
    const response = await apiClient.get<ApiResponse<ModelQuota[]>>('/user/ai-settings/quota');
    return response.data.result;
  },
};
