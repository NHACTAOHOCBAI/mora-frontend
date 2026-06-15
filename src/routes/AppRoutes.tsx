import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ChatPage } from '@/pages/ChatPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SpaceDetailPage } from '@/pages/SpaceDetailPage';

// Cấu hình Router sử dụng createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/space/:spaceId',
    element: <SpaceDetailPage />,
  },
  {
    path: '/document/:id',
    element: <ChatPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export const AppRoutes = () => {
  return <RouterProvider router={router} />;
};
