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

export const uploadDocument = async (file: File, spaceId: number, vectorPathThreshold?: number): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('spaceId', spaceId.toString());
  if (vectorPathThreshold !== undefined) {
    formData.append('vectorPathThreshold', vectorPathThreshold.toString());
  }
  
  const response = await apiClient.post<ApiResponse<any>>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.result;
};

export const deleteDocument = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/documents/${id}`);
};

export const renameDocument = async (id: number, fileName: string): Promise<any> => {
  const response = await apiClient.patch<ApiResponse<any>>(`/documents/${id}/rename`, { fileName });
  return response.data.result;
};

export const updateDocumentThreshold = async (id: number, threshold: number): Promise<any> => {
  const response = await apiClient.patch<ApiResponse<any>>(`/documents/${id}/threshold?threshold=${threshold}`);
  return response.data.result;
};
