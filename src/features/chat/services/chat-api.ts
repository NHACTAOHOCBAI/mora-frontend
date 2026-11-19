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

export type ChatStreamCallbacks = {
  onEvent: (name: string, payload: any) => void;
};

export const streamSpaceChatMessage = async (payload: SendSpaceChatPayload, requestId: string, callbacks: ChatStreamCallbacks) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const response = await fetch(`${baseUrl}/chat/space/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'X-Chat-Request-Id': requestId },
    body: JSON.stringify(payload),
  });
  if (!response.ok || !response.body) throw new Error('Không thể bắt đầu tạo câu trả lời AI.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '', event = 'message', data = '';
  const consumeLine = (line: string) => {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
    else if (!line && data) {
      callbacks.onEvent(event, JSON.parse(data));
      event = 'message'; data = '';
    }
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split(/\r?\n/); buffer = lines.pop() || '';
    lines.forEach(consumeLine);
    if (done) { if (buffer) consumeLine(buffer); break; }
  }
};

export const cancelSpaceChatStream = async (spaceId: number, requestId: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  await fetch(`${baseUrl}/chat/space/stream/${encodeURIComponent(requestId)}?spaceId=${spaceId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
  });
};

export const sendGroupMessage = async (payload: SendGroupMessagePayload): Promise<Message> => {
  const response = await apiClient.post<ApiResponse<Message>>('/chat/space/message', payload);
  return response.data.result;
};

export const clearSpaceChatHistory = async (spaceId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/chat/space/${spaceId}`);
};
