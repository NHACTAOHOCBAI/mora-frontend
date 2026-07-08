import { apiClient } from '@/services/api-client';
import type { SpaceResponse, SpaceDetailResponse, ApiResponse } from '../types';

export const getSpaces = async (): Promise<SpaceResponse[]> => {
  const response = await apiClient.get<ApiResponse<SpaceResponse[]>>('/spaces');
  return response.data.result;
};

export const getSpace = async (id: number): Promise<SpaceDetailResponse> => {
  const response = await apiClient.get<ApiResponse<SpaceDetailResponse>>(`/spaces/${id}`);
  return response.data.result;
};

export const createSpace = async (name: string, description: string): Promise<SpaceResponse> => {
  const response = await apiClient.post<ApiResponse<SpaceResponse>>('/spaces', { name, description });
  return response.data.result;
};

export const deleteSpace = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/spaces/${id}`);
};
