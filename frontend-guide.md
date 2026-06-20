# MORA FRONTEND - CODING STANDARDS & BEST PRACTICES

Tài liệu này định nghĩa cấu trúc dự án React Vite (TypeScript) và các quy định viết code (Coding Standards / Best Practices) của dự án **Mora Frontend**. Mọi lập trình viên và AI Agent khi tham gia đóng góp mã nguồn đều **bắt buộc** phải đọc và tuân thủ các quy tắc này.

---

## 1. Cấu trúc thư mục (Package Structure)

Dự án tuân thủ mô hình **Feature-based** kết hợp với các thư mục dùng chung:

```text
src/
├── assets/             # Hình ảnh, icons, font tĩnh
├── components/         # Các components dùng chung toàn dự án
│   ├── ui/             # Các components UI nguyên bản (Shadcn/ui)
│   └── shared/         # Components dùng chung tự viết (Header, Footer, ButtonLoading...)
├── config/             # Cấu hình dự án (Axios client, các biến môi trường...)
├── features/           # Phân chia theo nghiệp vụ/chức năng (Feature-based)
│   ├── [feature_name]/ # Ví dụ: auth, chat, user...
│   │   ├── components/ # Các components chỉ dùng riêng cho feature này
│   │   ├── hooks/      # Custom hooks riêng cho feature này (useLogin, useRegister...)
│   │   ├── services/   # Các hàm gọi API liên quan tới feature
│   │   ├── types/      # Định nghĩa TypeScript types cho feature
│   │   └── index.ts    # Entry point xuất bản các component/hook/type ra ngoài
├── hooks/              # Custom hooks dùng chung toàn dự án (useDebounce, useLocalStorage...)
├── layouts/            # Các layout hiển thị (MainLayout, AuthLayout...)
├── pages/              # Các trang chính ứng với các routes (Login.tsx, ChatPage.tsx...)
├── providers/          # Các Provider bọc ngoài App (QueryProvider, RouterProvider...)
├── routes/             # Cấu hình routes của ứng dụng (AppRoutes.tsx, routeGuard.tsx...)
├── types/              # Các định nghĩa TypeScript dùng chung toàn hệ thống
├── utils/              # Các hàm tiện ích dùng chung (formatDate, currencyFormatter...)
├── App.tsx             # Component gốc của ứng dụng
├── index.css           # File CSS chính tích hợp Tailwind CSS v4 & Theme variables
└── main.tsx            # Điểm khởi chạy React ứng dụng
```

---

## 2. Quy tắc lập trình chi tiết (Coding Rules)

### 2.1. Đặt tên & Tổ chức Component

- **Component Name:** Tên Component bắt buộc viết theo định dạng **PascalCase** (ví dụ: `LoginForm.tsx`, `Sidebar.tsx`).
- **Hooks Name:** Tên custom hooks viết theo dạng **camelCase** và bắt đầu bằng `use` (ví dụ: `useAuth.ts`, `useDebounce.ts`).
- **File Exporting:** Sử dụng **Named Export** thay vì Default Export để đảm bảo auto-import hoạt động nhất quán và tránh nhập nhằng tên.
  ```typescript
  // ĐÚNG
  export const UserCard = () => { ... }

  // SAI
  const UserCard = () => { ... }
  export default UserCard;
  ```
- **Type/Interface:** Luôn định nghĩa TypeScript types/interfaces cho props của component ngay phía trên component đó hoặc trong folder `types/` của feature.

### 2.2. Xử lý API & Server State (React Query & Axios)

- **Quy tắc:**
  1. Tuyệt đối **KHÔNG** gọi trực tiếp các phương thức của `axios` hoặc `fetch` trong `useEffect` của Component để load dữ liệu.
  2. Mọi logic gọi API phải thông qua client cấu hình sẵn tại `src/services/api-client.ts`.
  3. Sử dụng `@tanstack/react-query` để quản lý Server State. Bọc các query/mutation trong custom hooks nằm tại folder `hooks/` của feature tương ứng.

```typescript
// ĐÚNG: Custom hook quản lý logic Server State
// features/auth/hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { loginApi } from '../services/auth-api';

export const useLogin = () => {
  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      localStorage.setItem('token', data.accessToken);
    },
  });
};
```

### 2.3. Quản lý Form & Validation (React Hook Form & Zod)

- Mọi form tương tác (nhập liệu, submit) cần được quản lý bằng `react-hook-form` để tối ưu hiệu năng render.
- Validation của form phải sử dụng `zod` để định nghĩa schema và tích hợp thông qua `@hookform/resolvers/zod`.
- Tách schema ra file riêng nếu nó dài hơn 15 dòng hoặc dùng lại ở nhiều nơi.

```typescript
// Ví dụ Form Component hợp lệ
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng').min(1, 'Email là bắt buộc'),
  password: z.string().min(6, 'Mật khẩu phải từ 6 ký tự trở lên'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormValues) => {
    // Xử lý login
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit">Đăng Nhập</button>
    </form>
  );
};
```

### 2.4. Styling & Tailwind CSS

- Sử dụng Tailwind CSS v4 để styling. Định nghĩa các CSS variables cho theme (colors, fonts...) trong file `src/index.css` nếu cần thiết.
- Ưu tiên sử dụng các component của **shadcn/ui** (đặt trong `src/components/ui/`) trước. Nếu không có component phù hợp trong thư viện thì mới tiến hành tự custom.
- Khi cần custom class phức tạp hoặc có điều kiện (conditional classes), sử dụng utility helper `cn` được định nghĩa trong `src/lib/utils.ts` (kết hợp `clsx` và `tailwind-merge` để giải quyết xung đột CSS classes).
  ```typescript
  import { cn } from '@/lib/utils';

  export const CustomButton = ({ active }: { active: boolean }) => {
    return (
      <button className={cn('px-4 py-2 rounded bg-gray-200', active && 'bg-blue-600 text-white')}>
        Click me
      </button>
    );
  };
  ```

### 2.5. Routing & Lazy Loading

- Định nghĩa routes tập trung tại `src/routes/AppRoutes.tsx`.
- Luôn sử dụng `React.lazy()` kết hợp `Suspense` để chia nhỏ code (code-splitting) cho các page components, tránh phình to bundle chính:
  ```typescript
  import { lazy } from 'react';
  const DashboardPage = lazy(() => import('@/pages/Dashboard'));
  ```

### 2.6. Logging & Debugging

- Sử dụng `console.log` để debug khi dev, nhưng bắt buộc phải **Xóa sạch** hoặc cấu hình config tự động xóa console.log khi build sản phẩm thực tế (production).
- Sử dụng các thư viện thông báo (toast) để hiển thị lỗi thân thiện tới người dùng cuối thay vì alert thô sơ.
