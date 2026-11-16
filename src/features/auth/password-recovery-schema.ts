import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Vui lòng nhập email").email("Email không hợp lệ").max(100, "Email tối đa 100 ký tự"),
});
export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .refine(value => value.trim().length > 0, "Mật khẩu không được chỉ có khoảng trắng")
    .refine(value => new TextEncoder().encode(value).length <= 72, "Mật khẩu không được vượt quá 72 byte UTF-8"),
  confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp", path: ["confirmPassword"],
});
