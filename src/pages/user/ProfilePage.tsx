import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authApi } from "@/features/auth/services/auth-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BorderedCard } from "@/components/shared/BorderedCard";
import { toast } from "sonner";
import { Loader2, Camera, User, Lock, KeyRound, Check } from "lucide-react";

// Form Schema cho thông tin cá nhân
const profileSchema = z.object({
  fullName: z.string().min(1, "Họ và tên không được để trống").max(100, "Họ và tên tối đa 100 ký tự"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Form Schema cho thay đổi mật khẩu
const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Mật khẩu hiện tại là bắt buộc"),
  newPassword: z.string().min(6, "Mật khẩu mới phải từ 6 ký tự trở lên"),
  confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không trùng khớp",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Hook form cho thông tin cá nhân
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
    },
  });

  // Hook form cho thay đổi mật khẩu
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Mutation cập nhật thông tin cá nhân
  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Cập nhật thông tin cá nhân thành công!");
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi cập nhật";
      toast.error(`Cập nhật thất bại: ${msg}`);
    },
  });

  // Mutation đổi mật khẩu
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Thay đổi mật khẩu thành công!");
      resetPasswordForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || "Lỗi đổi mật khẩu";
      toast.error(`Đổi mật khẩu thất bại: ${msg}`);
    },
  });

  // Xử lý upload avatar
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Giới hạn 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng hình ảnh vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.");
      return;
    }

    // Định dạng hợp lệ
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP.");
      return;
    }

    setIsUploading(true);
    try {
      await authApi.uploadAvatar(file);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi tải ảnh";
      toast.error(`Cập nhật ảnh đại diện thất bại: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  if (!user) return null;

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Thông Tin Cá Nhân
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Quản lý thông tin tài khoản, ảnh đại diện và thay đổi mật khẩu của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột trái: Ảnh đại diện & Thông tin chung */}
        <div className="md:col-span-1 flex flex-col items-center space-y-6">
          <div className="w-full bg-card border border-border/80 rounded-xl p-6 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-300 relative flex items-center justify-center bg-muted">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-4xl font-extrabold text-muted-foreground uppercase">
                    {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                  </span>
                )}
                {/* Overlay khi hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white text-xs font-semibold space-y-1">
                  <Camera className="w-5 h-5 animate-pulse" />
                  <span>Thay đổi ảnh</span>
                </div>
                {/* Spinner khi đang upload */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            
            <div className="mt-4 space-y-1">
              <h3 className="font-bold text-lg text-foreground">{user.fullName}</h3>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>

            <div className="w-full border-t border-border mt-6 pt-4 text-left space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vai trò:</span>
                <span className="font-semibold text-primary">{user.role === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Học viên'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tham gia:</span>
                <span className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Cấu hình thông tin & đổi mật khẩu */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Cập nhật họ tên */}
          <BorderedCard
            title="Thông tin cơ bản"
            description="Thay đổi họ và tên hiển thị trên tài khoản của bạn."
            icon={<User className="w-5 h-5 text-primary" />}
          >
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Họ và tên
                </label>
                <Input
                  type="text"
                  placeholder="Nhập họ và tên đầy đủ..."
                  {...registerProfile("fullName")}
                />
                {profileErrors.fullName && (
                  <p className="text-xs text-destructive font-medium">
                    {profileErrors.fullName.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfileMutation.isPending} className="font-semibold flex items-center gap-1.5">
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Lưu thông tin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </BorderedCard>

          {/* Card 2: Đổi mật khẩu */}
          <BorderedCard
            title="Thay đổi mật khẩu"
            description="Đảm bảo mật khẩu của bạn có độ dài tối thiểu 6 ký tự để giữ tài khoản an toàn."
            icon={<Lock className="w-5 h-5 text-primary" />}
          >
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mật khẩu hiện tại
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...registerPassword("oldPassword")}
                />
                {passwordErrors.oldPassword && (
                  <p className="text-xs text-destructive font-medium">
                    {passwordErrors.oldPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Mật khẩu mới
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive font-medium">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Xác nhận mật khẩu mới
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive font-medium">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={changePasswordMutation.isPending} className="font-semibold flex items-center gap-1.5">
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang đổi...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Đổi mật khẩu
                    </>
                  )}
                </Button>
              </div>
            </form>
          </BorderedCard>
        </div>
      </div>
    </div>
  );
};
