import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DotPattern } from "@/components/ui/dot-pattern";
import { BorderBeam } from "@/components/ui/border-beam";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(4, "Tên đăng nhập phải chứa ít nhất 4 ký tự")
      .max(50, "Tên đăng nhập không được quá 50 ký tự"),
    email: z
      .string()
      .min(1, "Email không được để trống")
      .email("Email không đúng định dạng")
      .max(100, "Email không được quá 100 ký tự"),
    fullName: z
      .string()
      .min(1, "Họ tên không được để trống")
      .max(100, "Họ tên không được quá 100 ký tự"),
    password: z
      .string()
      .min(6, "Mật khẩu phải chứa ít nhất 6 ký tự")
      .max(100, "Mật khẩu không được quá 100 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
      });
      toast.success("Đăng ký tài khoản thành công! Hãy đăng nhập.");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Đăng ký thất bại. Tên đăng nhập hoặc Email có thể đã tồn tại.",
      );
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center p-6 overflow-hidden">
      <DotPattern
        width={24}
        height={24}
        cx={1}
        cy={1}
        cr={1.5}
        className="fill-neutral-300 text-neutral-300 dark:fill-neutral-600/50 dark:text-neutral-600/50 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
        glow={true}
      />

      {/* Main Content */}
      <Card className="relative z-10 overflow-hidden w-full max-w-md p-8 border border-border bg-card/90 rounded-2xl">
        <BorderBeam size={300} duration={8} />
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Tạo tài khoản
          </h1>
          <p className="text-sm text-muted-foreground">
            Bắt đầu khám phá không gian học tập Mora
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <Input
              type="text"
              placeholder="Nhập tên đăng nhập (từ 4 ký tự)"
              disabled={isRegistering}
              {...register("username")}
            />
            {errors.username && (
              <span className="text-xs text-destructive font-medium">
                {errors.username.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Họ và tên
            </label>
            <Input
              type="text"
              placeholder="Nhập họ và tên đầy đủ"
              disabled={isRegistering}
              {...register("fullName")}
            />
            {errors.fullName && (
              <span className="text-xs text-destructive font-medium">
                {errors.fullName.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Địa chỉ Email
            </label>
            <Input
              type="email"
              placeholder="email@example.com"
              disabled={isRegistering}
              {...register("email")}
            />
            {errors.email && (
              <span className="text-xs text-destructive font-medium">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mật khẩu
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              disabled={isRegistering}
              {...register("password")}
            />
            {errors.password && (
              <span className="text-xs text-destructive font-medium">
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Xác nhận mật khẩu
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              disabled={isRegistering}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <span className="text-xs text-destructive font-medium">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isRegistering}
            className="w-full mt-2 cursor-pointer py-5 rounded-xl font-bold"
          >
            {isRegistering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang đăng ký...
              </>
            ) : (
              "Đăng ký tài khoản"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-6">
          Đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-foreground hover:underline"
          >
            Đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};
