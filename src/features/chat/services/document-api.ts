import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '../types';

export interface DocumentResponse {
  id: number;
  name: string;
  storageUrl: string;
  fileSize: number;
  contentType: string;
  status: 'UPLOADING' | 'PARSING' | 'INDEXING' | 'READY' | 'FAILED';
  spaceId: number;
  createdAt: string;
}

export const uploadDocument = async (spaceId: number, file: File): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append('spaceId', spaceId.toString());
  formData.append('file', file);
  
  const response = await apiClient.post<ApiResponse<DocumentResponse>>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-tệp',
    },
  });
  return response.data.result;
};

export const deleteDocument = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`/documents/${id}`);
};
