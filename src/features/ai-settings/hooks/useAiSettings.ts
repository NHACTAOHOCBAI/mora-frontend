import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSettingsApi } from '../services/ai-settings-api';
import type { UserAiSettingRequest, TestApiKeyRequest } from '../types';

export const useAiSettings = () => {
  return useQuery({
    queryKey: ['user-ai-settings'],
    queryFn: aiSettingsApi.getSettings,
  });
};

export const useUpdateAiSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UserAiSettingRequest) => aiSettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-ai-settings'] });
      queryClient.invalidateQueries({ queryKey: ['user-ai-quota'] });
    },
  });
};

export const useTestApiKey = () => {
  return useMutation({
    mutationFn: (data: TestApiKeyRequest) => aiSettingsApi.testApiKey(data),
  });
};

export const useDailyQuota = () => {
  return useQuery({
    queryKey: ['user-ai-quota'],
    queryFn: aiSettingsApi.getDailyQuota,
    refetchInterval: 15000,
  });
};
