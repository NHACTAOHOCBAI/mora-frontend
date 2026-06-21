import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services/auth-api';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Lấy thông tin user hiện tại
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  // Mutation Đăng nhập
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      localStorage.setItem('token', data.token);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      // Đợi load xong user rồi mới hướng đi tiếp
      const userResult = await refetch();
      if (userResult.data?.role === 'ROLE_ADMIN') {
        navigate('/admin/users');
      } else {
        navigate('/');
      }
    },
  });

  // Mutation Đăng ký
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate('/login');
    },
  });

  // Hàm Đăng xuất
  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
    navigate('/login');
  };

  return {
    user,
    isAuthenticated: !!token && !!user,
    isLoading: isLoading && !!token,
    error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
  };
};
