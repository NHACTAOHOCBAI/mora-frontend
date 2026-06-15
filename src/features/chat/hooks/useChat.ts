import { useQuery, useMutation } from '@tanstack/react-query';
import { getDocumentDetails, sendChatMessage } from '../services/chat-api';
import type { DocumentChatRequest } from '../types';

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
