import { apiClient } from '@/services/api-client';
import type { DocumentChatRequest, DocumentChatResponse, DocumentDetailResponse, SpaceChatRequest, SpaceChatResponse, ChatMessageResponse, DocumentImageDebugResponse, ApiResponse } from '../types';

export const getDocumentDetails = async (id: number): Promise<DocumentDetailResponse> => {
  const response = await apiClient.get<ApiResponse<DocumentDetailResponse>>(`/documents/${id}`);
  return response.data.result;
};

export const sendChatMessage = async (request: DocumentChatRequest): Promise<DocumentChatResponse> => {
  const response = await apiClient.post<ApiResponse<DocumentChatResponse>>('/chat', request);
  return response.data.result;
};

export const sendSpaceChatMessage = async (request: SpaceChatRequest): Promise<SpaceChatResponse> => {
  const response = await apiClient.post<ApiResponse<SpaceChatResponse>>('/chat/space', request);
  return response.data.result;
};

export const generateStudyNotes = async (id: number): Promise<DocumentDetailResponse> => {
  const response = await apiClient.post<ApiResponse<DocumentDetailResponse>>(`/documents/${id}/generate-study-notes`);
  return response.data.result;
};

export const getDocumentChatHistory = async (documentId: number): Promise<ChatMessageResponse[]> => {
  const response = await apiClient.get<ApiResponse<ChatMessageResponse[]>>(`/chat/document/${documentId}`);
  return response.data.result;
};

export const getSpaceChatHistory = async (spaceId: number): Promise<ChatMessageResponse[]> => {
  const response = await apiClient.get<ApiResponse<ChatMessageResponse[]>>(`/chat/space/${spaceId}`);
  return response.data.result;
};

export const clearDocumentChatHistory = async (documentId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/chat/document/${documentId}`);
};

export const clearSpaceChatHistory = async (spaceId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/chat/space/${spaceId}`);
};

export const debugDocumentImages = async (id: number): Promise<DocumentImageDebugResponse[]> => {
  const response = await apiClient.get<ApiResponse<DocumentImageDebugResponse[]>>(`/documents/${id}/debug-images`);
  return response.data.result;
};
