import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDocumentDetails, 
  sendChatMessage, 
  sendSpaceChatMessage, 
  generateStudyNotes,
  getDocumentChatHistory,
  getSpaceChatHistory,
  clearDocumentChatHistory,
  clearSpaceChatHistory
} from '../services/chat-api';
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

export const useDocumentChatHistory = (documentId: number) => {
  return useQuery({
    queryKey: ['chat-history', 'document', documentId],
    queryFn: () => getDocumentChatHistory(documentId),
    enabled: !isNaN(documentId) && documentId > 0,
  });
};

export const useSpaceChatHistory = (spaceId: number) => {
  return useQuery({
    queryKey: ['chat-history', 'space', spaceId],
    queryFn: () => getSpaceChatHistory(spaceId),
    enabled: !isNaN(spaceId) && spaceId > 0,
  });
};

export const useClearDocumentChatHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: number) => clearDocumentChatHistory(documentId),
    onSuccess: (_, documentId) => {
      queryClient.setQueryData(['chat-history', 'document', documentId], []);
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

