import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  requireAdmin?: boolean;
}

// Bảo vệ các route yêu cầu đăng nhập
export const ProtectedRoute: React.FC<RouteGuardProps> = ({ requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const { user, isLoading, error } = useAuth();

  if (!token) {
    // Không có token -> Chưa đăng nhập, đẩy về login
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    // Đang tải thông tin user -> Hiển thị màn hình chờ xoay tròn đen trắng tinh tế
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-foreground" />
        <span className="text-sm text-muted-foreground font-medium animate-pulse">Đang xác thực thông tin...</span>
      </div>
    );
  }

  if (error || !user) {
    // Tải thông tin user thất bại hoặc không có user -> Xóa token và đẩy về login
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'ROLE_ADMIN') {
    // Yêu cầu quyền admin nhưng user hiện tại không phải ADMIN -> Đẩy về trang chủ
    return <Navigate to="/" replace />;
  }

  // Hợp lệ -> Cho phép render nội dung bên trong
  return <Outlet />;
};

// Bảo vệ các route chỉ dành cho khách (chưa đăng nhập) như login/register
export const GuestRoute: React.FC = () => {
  const token = localStorage.getItem('token');

  if (token) {
    // Đã có token -> Đẩy về trang chủ
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
