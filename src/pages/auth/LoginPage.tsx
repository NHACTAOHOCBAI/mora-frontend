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

const loginSchema = z.object({
  username: z.string().min(1, "Tên đăng nhập không được để trống"),
  password: z.string().min(6, "Mật khẩu phải chứa ít nhất 6 ký tự"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login({
        username: data.username,
        password: data.password,
      });
      toast.success("Đăng nhập thành công!");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
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
            Chào mừng trở lại
          </h1>
          <p className="text-sm text-muted-foreground">
            Đăng nhập tài khoản Mora của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <Input
              type="text"
              placeholder="Nhập tên đăng nhập của bạn"
              disabled={isLoggingIn}
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
              Mật khẩu
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              disabled={isLoggingIn}
              {...register("password")}
            />
            {errors.password && (
              <span className="text-xs text-destructive font-medium">
                {errors.password.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full mt-2 cursor-pointer py-5 rounded-xl font-bold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground mt-6">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="font-semibold text-foreground hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </Card>
    </div>
  );
};
