import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocumentDetails, sendChatMessage, sendSpaceChatMessage, generateStudyNotes } from '../services/chat-api';
import type { DocumentChatRequest, SpaceChatRequest } from '../types';

export const useDocumentDetails = (id: number) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocumentDetails(id),
    enabled: !isNaN(id) && id > 0,
  });
};

export const useSendChatMessage = () => {
  return useMutation({
    mutationFn: (request: DocumentChatRequest) => sendChatMessage(request),
  });
};

export const useSendSpaceChatMessage = () => {
  return useMutation({
    mutationFn: (request: SpaceChatRequest) => sendSpaceChatMessage(request),
  });
};

export const useGenerateStudyNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => generateStudyNotes(id),
    onSuccess: (data, id) => {
      queryClient.setQueryData(['document', id], data);
    },
  });
};
