import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Placeholder Pages (Sẽ được viết chi tiết hơn trong quá trình code)
const HomePlaceholder = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800 p-8">
    <h1 className="text-4xl font-extrabold tracking-tight mb-4">Chào mừng đến với Mora App</h1>
    <p className="text-lg text-slate-600 mb-6">Môi trường frontend đã được thiết lập thành công với Tailwind v4 và shadcn/ui!</p>
    <a 
      href="/login" 
      className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg"
    >
      Đi đến trang Login
    </a>
  </div>
);

const LoginPlaceholder = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-8">
    <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8 border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-900">Đăng Nhập</h2>
      <p className="text-slate-600 text-sm mb-6 text-center">Trang login boilerplate sử dụng React Router.</p>
      <button 
        onClick={() => {
          localStorage.setItem('token', 'dummy-token');
          window.location.href = '/dashboard';
        }}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
      >
        Simulate Login
      </button>
    </div>
  </div>
);

const DashboardPlaceholder = () => (
  <div className="min-h-screen bg-slate-50 p-8">
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Dashboard</h1>
      <p className="text-slate-700 mb-6">Đây là khu vực bảo mật yêu cầu đăng nhập.</p>
      <button 
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}
        className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 transition"
      >
        Đăng Xuất
      </button>
    </div>
  </div>
);

// Route Guard bảo vệ các route yêu cầu xác thực
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Cấu hình Router sử dụng createBrowserRouter
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePlaceholder />,
  },
  {
    path: '/login',
    element: <LoginPlaceholder />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPlaceholder />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export const AppRoutes = () => {
  return <RouterProvider router={router} />;
};
