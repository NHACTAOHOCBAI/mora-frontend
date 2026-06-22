import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './RouteGuard';
import { Loader2 } from 'lucide-react';

// Lazy loading các trang
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@/pages/user/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SpaceDetailPage = lazy(() => import('@/pages/user/space-detail/SpaceDetailPage').then(m => ({ default: m.SpaceDetailPage })));
const ChatPage = lazy(() => import('@/pages/user/ChatPage').then(m => ({ default: m.ChatPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
import { AdminLayout } from '@/layouts/AdminLayout';
import { MainLayout } from '@/layouts/MainLayout';

// Loading component tạm thời
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-10 h-10 animate-spin text-foreground" />
    <span className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải trang...</span>
  </div>
);

const router = createBrowserRouter([
  // Guest Routes (Chỉ cho phép khách truy cập)
  {
    element: <GuestRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/login',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: '/register',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  // Protected Routes (Yêu cầu đăng nhập thông thường)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <DashboardPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: '/space/:spaceId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SpaceDetailPage />
          </Suspense>
        ),
      },
      {
        path: '/document/:id',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ChatPage />
          </Suspense>
        ),
      },
    ],
  },
  // Admin Routes (Yêu cầu quyền ADMIN)
  {
    element: <ProtectedRoute requireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: '/admin/users',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
          {
            path: '/admin/user',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <AdminUsersPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  // Mặc định chuyển về trang chủ
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};
