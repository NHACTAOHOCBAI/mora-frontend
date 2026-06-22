import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../services/admin-api';
import type { AdminUserUpdateRequest } from '../services/admin-api';
import type { QueryParams } from '@/types/query';

export const useAdminUsersQuery = (params: QueryParams) => {
  return useQuery({
    queryKey: ['adminUsers', params],
    queryFn: () => adminApi.getAllUsers(params),
  });
};

export const useAdminUsers = (params?: QueryParams) => {
  const queryClient = useQueryClient();

  const usersQuery = useAdminUsersQuery(params || {});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdminUserUpdateRequest }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  return {
    users: usersQuery.data,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    refetch: usersQuery.refetch,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
