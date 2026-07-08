import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api-client';
import type { SpaceDetailResponse } from '../types';

export const useSpaceDetail = (spaceId: number) => {
  return useQuery({
    queryKey: ['spaceDetail', spaceId],
    queryFn: async () => {
      const response = await apiClient.get<{ result: SpaceDetailResponse }>(`/spaces/${spaceId}`);
      return response.data.result;
    },
    enabled: !!spaceId && !isNaN(spaceId),
  });
};
