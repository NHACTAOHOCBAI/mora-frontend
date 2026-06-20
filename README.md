# Mora Frontend

Mora Frontend là ứng dụng giao diện được xây dựng bằng **React 19** và **Vite**, tích hợp hệ sinh thái thư viện hiện đại nhằm tối ưu hóa hiệu năng, trải nghiệm lập trình và trải nghiệm người dùng trong dự án **Mora - AI-Powered Social Learning Network**.

---

## 🚀 Công Nghệ Sử Dụng (Tech Stack)

*   **Framework**: [React 19](https://react.dev/) & [Vite 8](https://vite.dev/) (TypeScript)
*   **Styling & UI Components**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **State Management (Server State)**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
*   **Routing**: [React Router](https://reactrouter.com/) (v6/v7)
*   **HTTP Client**: [Axios](https://axios-http.com/) (Interceptors đính kèm JWT Token tự động)
*   **Form & Validation**: [React Hook Form](https://react-hook-form.com/) kết hợp với [Zod](https://zod.dev/)
*   **PDF Rendering**: [react-pdf](https://projects.wojtekmaj.pl/react-pdf/) (Hỗ trợ lật trang, cuộn trang và hiển thị tài liệu PDF trực tuyến)

---

## 📂 Cấu Trúc Thư Mục (Folder Structure)

Dự án tuân theo mô hình **Feature-based** để dễ dàng mở rộng khi hệ thống lớn lên:

```text
src/
├── assets/             # Hình ảnh, icons, font tĩnh
├── components/         # Các components dùng chung toàn dự án
│   ├── ui/             # Các components UI nguyên bản (Shadcn/ui)
│   └── shared/         # Components dùng chung tự viết
├── config/             # Cấu hình dự án (Axios client, biến môi trường...)
├── features/           # Phân chia thư mục theo nghiệp vụ/chức năng (Auth, Chat, User...)
│   └── chat/
│       ├── components/ # Components nội bộ (ChatContainer, PdfViewer, MessageItem...)
│       ├── hooks/      # Hooks nghiệp vụ (API queries/mutations)
│       ├── services/   # Services gọi API (chat-api.ts)
│       └── types/      # Định nghĩa TypeScript Types
├── hooks/              # Custom hooks dùng chung toàn dự án
├── layouts/            # Layout hiển thị chính (MainLayout, AuthLayout...)
├── pages/              # Màn hình/Trang tương ứng với mỗi Router (SpaceDetailPage, ChatPage, Dashboard...)
├── providers/          # Các Provider bọc ngoài App (QueryProvider...)
├── routes/             # Cấu hình routes ứng dụng (AppRoutes)
├── types/              # Định nghĩa Types dùng chung toàn dự án
└── utils/              # Các hàm tiện ích dùng chung
```

---

## 🚀 Tính năng Nổi bật (Core Features)

1.  **Giao diện Split-Screen hiện đại (Chia đôi màn hình):**
    *   **Bên trái (AI Chat & Study helper):** Khung hội thoại AI, cho phép chuyển đổi mượt mà giữa các tab hỏi đáp và học tập.
    *   **Bên phải (Document PDF Viewer):** Tải trực tiếp file PDF từ Object Storage đám mây, hỗ trợ điều hướng, lật trang chính xác.
2.  **Kết xuất Bảng biểu Premium (Markdown Tables / GFM Support):**
    *   Tích hợp thư viện `remark-gfm` trong `ReactMarkdown` tại `ChatContainer` và `SpaceDetailPage`.
    *   Tự động phát hiện và render các bảng Markdown so sánh, đối chiếu do AI trả về với định dạng UI cao cấp (rounded borders, shadow, alternating row background, hover effects).
3.  **Trích dẫn tương tác (Interactive Citation):**
    *   Nhận kết quả cấu trúc kèm định vị vị trí trích dẫn của câu trả lời AI từ backend.
    *   Khi người dùng click vào các nhãn trích dẫn (ví dụ: `📍 Trang 5`), trình xem PDF bên phải sẽ tự động nhảy đến đúng trang số 5 ngay lập tức.
4.  **Hỏi đáp Đa tài liệu (Space-Wide Chat):**
    *   Cho phép đặt câu hỏi trên toàn bộ Không gian học tập (nhiều tài liệu). AI sẽ tổng hợp câu trả lời kèm nhãn chỉ định rõ tài liệu nào và trang số mấy đã trích dẫn thông tin.
4.  **Tóm tắt & Flashcards học tập tự động:**
    *   Tự động sinh bản tóm tắt học thuật đầy đủ cho tài liệu.
    *   Tạo danh sách các Flashcards tương tác, hỗ trợ lật thẻ xem đáp án, điều hướng các câu hỏi giúp ôn tập bài học tốt hơn.
5.  **Lưu trữ & Dọn dẹp Lịch sử hội thoại:**
    *   Lịch sử chat được tự động tải từ database mỗi khi bạn truy cập trang.
    *   Cung cấp nút **Xóa lịch sử** (`Trash2` icon) đặt cạnh nút thu gọn khung chat giúp người dùng làm sạch hội thoại nhanh chóng.
6.  **Chế độ Developer Mode (Chế độ Debug) & Trình gỡ lỗi nâng cao:**
    *   **Quản lý Trạng thái:** Công tắc bật/tắt ở sidebar được lưu vào `localStorage` (`mora_dev_mode`) giúp duy trì trạng thái khi tải lại trang.
    *   **Phân tách Giao diện:**
        *   *Khi tắt (User Mode):* Cung cấp một giao diện học tập tối giản và sạch sẽ cho người dùng phổ thông, ẩn các tính năng kỹ thuật.
        *   *Khi bật (Developer Mode):* Hiển thị các công cụ hỗ trợ gỡ lỗi và kiểm tra:
            - **Slider Ngưỡng Vector Path:** Điều chỉnh độ nhạy phát hiện sơ đồ vector trực tiếp trên thanh bên từ 5 đến 200, tự động cập nhật và quét lại tài liệu trên hệ thống.
            - **Icon Debug hình ảnh (Bug):** Mở Dialog Debug Hình Ảnh chi tiết để kiểm tra XObjects trích xuất từ PDF cùng chế độ Zoom View phóng to hình ảnh gốc.
            - **Prompt Debugger:** Nhấp đúp (Double-click) vào câu trả lời của AI để xem chi tiết Prompt thô kèm các thẻ ảnh Base64 được gửi tới Gemini API.
            - **Câu hỏi tối ưu:** Hiển thị câu hỏi đã được tối ưu hóa (condensed question) dưới tin nhắn trợ lý.

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
*   Đặt tên component bằng **PascalCase** (ví dụ: `LoginForm.tsx`).
*   Sử dụng **Named Export** thay vì Default Export.
*   Không gọi API trực tiếp trong component; luôn bọc qua **React Query** custom hooks.
*   Validate Form bằng **Zod** schema và **React Hook Form**.
*   Sử dụng path alias `@/` khi import (ví dụ: `@/components/ui/button` thay vì `../../components/ui/button`).
