# Kế hoạch cải thiện giao diện với Magic UI & Aceternity UI (Style Tối Giản Monochromatic)

Kế hoạch này đề xuất các cải tiến về mặt giao diện (UI) và trải nghiệm (UX) cho ứng dụng Mora Frontend bằng cách sử dụng các component của **Magic UI** và **Aceternity UI**.
Toàn bộ thiết kế vẫn tuân thủ nghiêm ngặt phong cách hiện tại của Mora: **tối giản, hiện đại, sử dụng gam màu đen - trắng - xám (monochrome)**.

---

## User Review Required

> [!IMPORTANT]
>
> 1. Chúng tôi sẽ giữ nguyên tone màu đen-trắng-xám hiện tại. Các hiệu ứng từ Magic UI/Aceternity UI (như Border Beam, Dot Pattern) sẽ được điều chỉnh màu sắc sang các sắc độ xám/trắng/đen thay vì sử dụng màu RGB/Rainbow sặc sỡ để duy trì tính nhất quán.
> 2. Các thư viện sẽ được cài đặt bằng CLI chính thức (`npx shadcn@latest add ...`) theo yêu cầu của bạn, thay vì tự ý thêm code thủ công.

---

## Open Questions

> [!WARNING]
> Bạn có muốn áp dụng hiệu ứng **Border Beam** (viền sáng chạy xung quanh card) hay hiệu ứng **Card Hover Effect** (phần nền di chuyển mượt mà khi hover) cho danh sách các Không gian học tập (Space) ở trang Dashboard? Hoặc bạn có đề xuất hiệu ứng cụ thể nào khác không?

---

## Proposed Changes

Dưới đây là chi tiết các câu lệnh cài đặt và các file sẽ thay đổi:

### 1. Cài đặt các Component từ CLI

Chúng ta sẽ chạy các lệnh cài đặt các component UI từ Magic UI & Aceternity UI vào thư mục `src/components/ui/`:

```bash
# Cài đặt Dot Pattern để làm nền chấm tối giản cho các trang
npx shadcn@latest add @magicui/dot-pattern

# Cài đặt Border Beam làm viền sáng tinh tế cho Login/Register Card và Space Cards
npx shadcn@latest add @magicui/border-beam

# Cài đặt Ripple làm hiệu ứng gợn sóng tinh tế cho các trang Auth
npx shadcn@latest add @magicui/ripple
```

---

### 2. Chi tiết các trang thay đổi

#### [MODIFY] [LoginPage.tsx](file:///c:/Users/phucnd/Desktop/Mora/mora-frontend/src/pages/auth/LoginPage.tsx)

- Thêm `DotPattern` làm hình nền động nhẹ nhàng phía sau.
- Sử dụng mặt nạ gradient radial cho `DotPattern` để làm mờ dần các chấm ở rìa và góc, tăng tính thẩm mỹ.
- Bọc thẻ `Card` đăng nhập bằng component `BorderBeam` với tone màu xám/trắng chạy xung quanh viền để tạo cảm giác premium.

#### [MODIFY] [RegisterPage.tsx](file:///c:/Users/phucnd/Desktop/Mora/mora-frontend/src/pages/auth/RegisterPage.tsx)

- Thực hiện tương tự như `LoginPage.tsx` (tích hợp `DotPattern` và `BorderBeam` viền xám/trắng).

#### [MODIFY] [DashboardPage.tsx](file:///c:/Users/phucnd/Desktop/Mora/mora-frontend/src/pages/user/DashboardPage.tsx)

- Tích hợp `DotPattern` làm nền mờ phía dưới khu vực nội dung chính.
- Sử dụng hiệu ứng hover tinh tế hoặc tích hợp `BorderBeam` cho các card Space khi người dùng hover vào.
- Điều chỉnh bố cục phần "Tạo Space Mới" và các nút bấm sử dụng micro-interactions mượt mà.

---

## Verification Plan

### Automated Tests

- Chạy `npm run build` để kiểm tra TypeScript compilation và Vite build nhằm đảm bảo không có lỗi import hay thiếu thư viện.

### Manual Verification

1. Truy cập trang `/login` và `/register` để xác nhận:
   - Nền chấm `DotPattern` hiển thị mịn màng và chuyển màu mượt ở các rìa.
   - Thẻ đăng nhập/đăng ký có viền sáng chạy quanh bằng `BorderBeam` sắc xám/trắng.
2. Truy cập `/dashboard`:
   - Xác nhận nền chấm hoạt động tốt ở cả Light Mode và Dark Mode.
   - Kiểm tra hiệu ứng hover trên danh sách các Space Cards.

---

## So sánh Trước/Sau (Before/After)

| Trang / Thành phần                  | Trước khi cải tiến                                               | Sau khi cải tiến                                                                                                                    |
| :---------------------------------- | :--------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Nền các trang (Auth, Dashboard)** | Trơn một màu (`bg-background`) trông khá đơn điệu và trống trải. | Nền chấm bi `DotPattern` mờ xám kết hợp mặt nạ gradient tạo chiều sâu cho UI.                                                       |
| **Login / Register Cards**          | Card tĩnh bình thường với bóng nhẹ (`shadow-lg`).                | Card được bao bọc bởi một viền chuyển động ánh sáng mượt mà (`BorderBeam` màu xám/trắng), khi hover có cảm giác tương tác phản hồi. |
| **Space Cards (Dashboard)**         | Card phẳng, hover chuyển đổi màu nền cơ bản.                     | Card có hiệu ứng mượt mà và tương tác nâng cao, hiển thị nút thao tác rõ ràng.                                                      |
