import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSpaceChatHistory,
  sendSpaceChatMessage,
  sendGroupMessage,
  clearSpaceChatHistory,
  type SendSpaceChatPayload,
  type SendGroupMessagePayload,
} from '../services/chat-api';
import type { Message } from '../types';

export const useSpaceChatHistory = (spaceId: number, options?: any) => {
  return useQuery<Message[]>({
    queryKey: ['chat-history', 'space', spaceId],
    queryFn: () => getSpaceChatHistory(spaceId),
    enabled: !isNaN(spaceId) && spaceId > 0,
    ...options,
  });
};

export const useSendSpaceChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendSpaceChatPayload) => sendSpaceChatMessage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', 'space', variables.spaceId] });
    },
  });
};

export const useSendGroupMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendGroupMessagePayload) => sendGroupMessage(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', 'space', variables.spaceId] });
    },
  });
};

export const useClearSpaceChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spaceId: number) => clearSpaceChatHistory(spaceId),
    onSuccess: (_, spaceId) => {
      queryClient.setQueryData(['chat-history', 'space', spaceId], []);
    },
  });
};
