import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ProtectedRoute, GuestRoute } from './RouteGuard';
import { UnexpectedErrorPage } from "@/components/shared/UnexpectedErrorPage";
import { Loader2 } from 'lucide-react';

// Lazy loading các trang
const NotFoundPage = lazy(() => import('@/pages/errors/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('@/pages/user/DashboardPage').then(m => ({ default: m.DashboardPage })));
const SpaceDetailPage = lazy(() => import('@/pages/user/space-detail/SpaceDetailPage').then(m => ({ default: m.SpaceDetailPage })));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage').then(m => ({ default: m.ProfilePage })));
const JoinSpacePage = lazy(() => import('@/pages/user/JoinSpacePage').then(m => ({ default: m.JoinSpacePage })));
const PrivacyPage = lazy(() => import('@/pages/legal/LegalPage').then(m => ({ default: () => <m.LegalPage kind="privacy" /> })));
const TermsPage = lazy(() => import('@/pages/legal/LegalPage').then(m => ({ default: () => <m.LegalPage kind="terms" /> })));
const HelpPage = lazy(() => import('@/pages/help/HelpPage').then(m => ({ default: m.HelpPage })));
import { AdminLayout } from '@/layouts/AdminLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

// Loading component tạm thời
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-10 h-10 animate-spin text-foreground" />
    <span className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải trang...</span>
  </div>
);

const router = createBrowserRouter([{
  errorElement: <UnexpectedErrorPage />,
  children: [
  {
    element: <PublicLayout />,
    children: [
      { path: '/privacy', element: <Suspense fallback={<LoadingFallback />}><PrivacyPage /></Suspense> },
      { path: '/terms', element: <Suspense fallback={<LoadingFallback />}><TermsPage /></Suspense> },
      { path: '/help', element: <Suspense fallback={<LoadingFallback />}><HelpPage /></Suspense> },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: '/forgot-password', element: <Suspense fallback={<LoadingFallback />}><ForgotPasswordPage /></Suspense> },
      { path: '/reset-password', element: <Suspense fallback={<LoadingFallback />}><ResetPasswordPage /></Suspense> },
    ],
  },
  // Guest Routes (Chỉ cho phép khách truy cập)
  {
    element: <GuestRoute />,
    children: [
      {
        element: <PublicLayout />,
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
          {
            path: '/profile',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <ProfilePage />
              </Suspense>
            ),
          },
          {
            path: '/join/:inviteCode',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <JoinSpacePage />
              </Suspense>
            ),
          },
          {
            path: '/space/:spaceId',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <SpaceDetailPage />
              </Suspense>
            ),
          },
        ],
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
  // Unknown URLs stay visible and are accessible without signing in.
  {
    element: <PublicLayout />,
    children: [{ path: '*', element: <Suspense fallback={<LoadingFallback />}><NotFoundPage /></Suspense> }],
  },
  ],
}]);

export const AppRoutes: React.FC = () => {
  return <RouterProvider router={router} />;
};
