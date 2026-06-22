import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

const loginSchema = z.object({
  username: z.string().min(1, 'Tên đăng nhập không được để trống'),
  password: z.string().min(6, 'Mật khẩu phải chứa ít nhất 6 ký tự'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login({
        username: data.username,
        password: data.password,
      });
      toast.success('Đăng nhập thành công!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between transition-colors duration-200">
      {/* Header */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-border bg-card/85 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="p-1 bg-muted rounded-lg border border-border flex items-center justify-center w-9 h-9 overflow-hidden">
            <img src="/frog-logo.png" alt="Mora Logo" className="w-7 h-7 object-contain dark:invert" />
          </div>
          <span className="font-bold text-lg tracking-wider text-foreground">Mora</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8 border border-border bg-card shadow-lg rounded-2xl space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">Chào mừng trở lại</h1>
            <p className="text-sm text-muted-foreground">Đăng nhập tài khoản Mora của bạn</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Tên đăng nhập
              </label>
              <Input
                type="text"
                placeholder="Nhập tên đăng nhập của bạn"
                disabled={isLoggingIn}
                {...register('username')}
              />
              {errors.username && (
                <span className="text-xs text-destructive font-medium">{errors.username.message}</span>
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
                {...register('password')}
              />
              {errors.password && (
                <span className="text-xs text-destructive font-medium">{errors.password.message}</span>
              )}
            </div>

            <Button type="submit" disabled={isLoggingIn} className="w-full mt-2 cursor-pointer py-5 rounded-xl font-bold">
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-foreground hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        &copy; {new Date().getFullYear()} Mora. Tất cả các quyền được bảo lưu.
      </footer>
    </div>
  );
};
