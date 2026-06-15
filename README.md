# Mora Frontend

Mora Frontend là ứng dụng giao diện được xây dựng bằng **React 19** và **Vite**, tích hợp hệ sinh thái thư viện hiện đại nhằm tối ưu hóa hiệu năng, trải nghiệm lập trình và trải nghiệm người dùng.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

- **Framework**: [React 19](https://react.dev/) & [Vite 8](https://vite.dev/) (TypeScript)
- **Styling & UI Components**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management (Server State)**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Routing**: [React Router](https://reactrouter.com/) (v6/v7)
- **HTTP Client**: [Axios](https://axios-http.com/) (Tự động hóa Interceptors cấu hình JWT Token)
- **Form & Validation**: [React Hook Form](https://react-hook-form.com/) kết hợp với [Zod](https://zod.dev/)

---

## 📂 Cấu Trúc Thư Mục (Folder Structure)

Dự án tuân theo mô hình **Feature-based** để dễ dàng mở rộng khi hệ thống lớn lên:

```text
src/
├── assets/             # Hình ảnh, icons, font tĩnh
├── components/         # Các components dùng chung toàn dự án
│   ├── ui/             # Các components UI nguyên bản (Shadcn/ui)
│   └── shared/         # Components dùng chung tự viết (Header, Footer, Loading...)
├── config/             # Cấu hình dự án (Axios client, biến môi trường...)
├── features/           # Phân chia thư mục theo nghiệp vụ/chức năng (Auth, Chat, User...)
│   └── [feature_name]/
│       ├── components/ # Components nội bộ của feature
│       ├── hooks/      # Hooks nghiệp vụ (API queries/mutations)
│       ├── services/   # Services gọi API
│       ├── types/      # Định nghĩa TypeScript Types
│       └── index.ts    # Điểm xuất khẩu dữ liệu dùng ra bên ngoài
├── hooks/              # Custom hooks dùng chung toàn dự án
├── layouts/            # Layout hiển thị chính (MainLayout, AuthLayout...)
├── pages/              # Màn hình/Trang tương ứng với mỗi Router
├── providers/          # Các Provider bọc ngoài App (QueryProvider...)
├── routes/             # Cấu hình routes ứng dụng (AppRoutes)
├── types/              # Định nghĩa Types dùng chung toàn dự án
└── utils/              # Các hàm tiện ích dùng chung
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### 1. Cài đặt dependencies
Đảm bảo bạn đã cài đặt Node.js phiên bản mới (khuyến nghị v18+ hoặc v20+).
```bash
npm install
```

### 2. Biến Môi Trường (Environment Variables)
Tạo file `.env` ở thư mục gốc của dự án và cấu hình đường dẫn API:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Chạy môi trường phát triển (Development)
```bash
npm run dev
```

### 4. Build sản phẩm (Production)
```bash
npm run build
```
Thư mục chứa kết quả build sẽ là `dist/`.

### 5. Xem trước bản Build (Preview)
```bash
npm run preview
```

---

## 📜 Quy Định Viết Code (Coding Standards)

Để dự án được đồng bộ và nhất quán, vui lòng đọc kỹ tài liệu **[frontend-guide.md](./frontend-guide.md)** trước khi tham gia viết code. Một số quy tắc quan trọng:
- Đặt tên component bằng **PascalCase** (ví dụ: `LoginForm.tsx`).
- Sử dụng **Named Export** thay vì Default Export.
- Không gọi API trực tiếp trong component; luôn bọc qua **React Query** custom hooks.
- Validate Form bằng **Zod** schema và **React Hook Form**.
- Sử dụng path alias `@/` khi import (ví dụ: `@/components/ui/button` thay vì `../../components/ui/button`).
