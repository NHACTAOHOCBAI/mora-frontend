import { apiClient } from '@/services/api-client';
import type { DocumentChatRequest, DocumentChatResponse, DocumentDetailResponse } from '../types';

export const getDocumentDetails = async (id: number): Promise<DocumentDetailResponse> => {
  const response = await apiClient.get<DocumentDetailResponse>(`/documents/${id}`);
  return response.data;
};

export const sendChatMessage = async (request: DocumentChatRequest): Promise<DocumentChatResponse> => {
  const response = await apiClient.post<DocumentChatResponse>('/chat', request);
  return response.data;
};
