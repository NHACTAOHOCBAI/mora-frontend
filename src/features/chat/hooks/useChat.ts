import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { Message } from '../types';

export const useSpaceChatHistory = (spaceId: number) => {
  return useQuery({
    queryKey: ['chat-history', 'space', spaceId],
    queryFn: async () => {
      const response = await apiClient.get<{ result: Message[] }>(`/chat/space/${spaceId}`);
      return response.data.result;
    },
    enabled: !isNaN(spaceId) && spaceId > 0,
  });
};

export const useSendSpaceChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { spaceId: number; question: string; history?: any[] }) => {
      const response = await apiClient.post<{ result: any }>('/chat/space', data);
      return response.data.result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', 'space', variables.spaceId] });
    },
  });
};


export const useClearSpaceChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (spaceId: number) => {
      await apiClient.delete(`/chat/space/${spaceId}`);
    },
    onSuccess: (_, spaceId) => {
      queryClient.setQueryData(['chat-history', 'space', spaceId], []);
    },
  });
};
