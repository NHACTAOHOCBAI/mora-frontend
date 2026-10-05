import { apiClient } from '@/services/api-client';
import type { Message, ApiResponse } from '../types';

export interface SendSpaceChatPayload {
  spaceId: number;
  question: string;
  history?: any[];
  documentIds?: number[];
}

export interface SendGroupMessagePayload {
  spaceId: number;
  text: string;
}

export const getSpaceChatHistory = async (spaceId: number): Promise<Message[]> => {
  const response = await apiClient.get<ApiResponse<Message[]>>(`/chat/space/${spaceId}`);
  return response.data.result;
};

export const sendSpaceChatMessage = async (payload: SendSpaceChatPayload): Promise<any> => {
  const response = await apiClient.post<ApiResponse<any>>('/chat/space', payload);
  return response.data.result;
};

export const sendGroupMessage = async (payload: SendGroupMessagePayload): Promise<Message> => {
  const response = await apiClient.post<ApiResponse<Message>>('/chat/space/message', payload);
  return response.data.result;
};

export const clearSpaceChatHistory = async (spaceId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/chat/space/${spaceId}`);
};
