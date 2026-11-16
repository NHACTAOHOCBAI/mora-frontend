import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '../types';
import type { PinnedMessageResponse } from "../types";

export const getMessagePins = async (spaceId: number) => {
  const response = await apiClient.get<ApiResponse<PinnedMessageResponse[]>>(`/chat/space/${spaceId}/pins`);
  return response.data.result;
};

export const setMessagePinned = async (spaceId: number, messageId: number, pinned: boolean) => {
  const path = `/chat/space/${spaceId}/pins/${messageId}`;
  if (pinned) await apiClient.put(path);
  else await apiClient.delete(path);
};
