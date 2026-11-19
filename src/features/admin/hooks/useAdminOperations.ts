import { useQuery } from '@tanstack/react-query';
import { adminApi, type DocumentStatus } from '../services/admin-api';
import type { QueryParams } from '@/types/query';

export const useAdminDashboard = (range: number) => useQuery({
  queryKey: ['adminDashboard', range],
  queryFn: () => adminApi.getDashboard(range),
  refetchInterval: 15_000,
  refetchIntervalInBackground: true,
});
export const useAdminSpaces = (params: QueryParams) => useQuery({ queryKey: ['adminSpaces', params], queryFn: () => adminApi.getSpaces(params) });
export const useAdminSpace = (id: number) => useQuery({ queryKey: ['adminSpace', id], queryFn: () => adminApi.getSpace(id), enabled: Number.isSafeInteger(id) && id > 0 });
export const useAdminDocuments = (params: QueryParams) => useQuery({
  queryKey: ['adminDocuments', params],
  queryFn: () => adminApi.getDocuments({ ...params, status: params.status as DocumentStatus | undefined }),
});
export const useAdminDocument = (id: number) => useQuery({ queryKey: ['adminDocument', id], queryFn: () => adminApi.getDocument(id), enabled: Number.isSafeInteger(id) && id > 0 });
export const useAdminUser = (id: number) => useQuery({ queryKey: ['adminUser', id], queryFn: () => adminApi.getUser(id), enabled: Number.isSafeInteger(id) && id > 0 });
