import { apiClient } from '@/services/api-client';
import type { DocumentChatRequest, DocumentChatResponse, DocumentDetailResponse, SpaceChatRequest, SpaceChatResponse } from '../types';

export const getDocumentDetails = async (id: number): Promise<DocumentDetailResponse> => {
  const response = await apiClient.get<DocumentDetailResponse>(`/documents/${id}`);
  return response.data;
};

export const sendChatMessage = async (request: DocumentChatRequest): Promise<DocumentChatResponse> => {
  const response = await apiClient.post<DocumentChatResponse>('/chat', request);
  return response.data;
};

export const sendSpaceChatMessage = async (request: SpaceChatRequest): Promise<SpaceChatResponse> => {
  const response = await apiClient.post<SpaceChatResponse>('/chat/space', request);
  return response.data;
};

export const generateStudyNotes = async (id: number): Promise<DocumentDetailResponse> => {
  const response = await apiClient.post<DocumentDetailResponse>(`/documents/${id}/generate-study-notes`);
  return response.data;
};
