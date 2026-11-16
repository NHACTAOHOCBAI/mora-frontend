import { useAuthRedirect } from "@/features/auth/hooks/useAuthRedirect";
import { setSessionToken } from "@/features/auth/session";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, Eye, EyeOff, Loader2, Link2Off, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordRecoveryCard } from "@/features/auth/components/PasswordRecoveryCard";
import { resetPasswordSchema } from "@/features/auth/password-recovery-schema";
import { useResetPassword } from "@/features/auth/hooks/usePasswordRecovery";
import { AppApiError, getErrorMessage } from "@/lib/api-error";

export const ResetPasswordPage = () => {
  const { authHref } = useAuthRedirect();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const mutation = useResetPassword();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [visible, setVisible] = useState(false);
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });
  // Do not send a recovery token to other origins in the Referer header.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "referrer"; meta.content = "no-referrer";
    document.head.append(meta);
    return () => meta.remove();
  }, []);
  const submit = async (data: z.infer<typeof resetPasswordSchema>) => {
    form.clearErrors("root");
    try {
      await mutation.mutateAsync({ token, newPassword: data.newPassword });
      setSessionToken(null); localStorage.removeItem("originalToken");
      queryClient.clear();
      form.reset();
      setSuccess(true);
    } catch (error) {
      if (error instanceof AppApiError && error.code === 1040) setInvalid(true);
      else form.setError("root", { message: getErrorMessage(error) });
    }
  };
  if (!/^[A-Za-z0-9_-]{43}$/.test(token) || invalid) {
    return <PasswordRecoveryCard title="Liên kết không còn hiệu lực" icon={<Link2Off />}
      description="Liên kết khôi phục không hợp lệ, đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới.">
      <Button className="h-10 w-full" render={<Link to={authHref("/forgot-password")} />}>Yêu cầu liên kết mới</Button>
      <Link to={authHref("/login")} className="text-center text-sm text-muted-foreground hover:underline">Quay về đăng nhập</Link>
    </PasswordRecoveryCard>;
  }
  if (success) {
    return <PasswordRecoveryCard title="Đã đặt lại mật khẩu" icon={<CheckCircle2 />} description="Bạn có thể đăng nhập Mora bằng mật khẩu mới. Các phiên đăng nhập cũ đã bị vô hiệu hóa.">
      <Button className="h-10 w-full" render={<Link to={authHref("/login")} />}>Đăng nhập</Button>
    </PasswordRecoveryCard>;
  }
  return (
    <PasswordRecoveryCard title="Đặt lại mật khẩu" icon={<KeyRound />} description="Chọn mật khẩu mới cho tài khoản Mora của bạn.">
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mật khẩu mới</label>
          <div className="relative">
            <Input id="new-password" type={visible ? "text" : "password"} autoComplete="new-password"
              autoFocus className="h-10 pr-10" disabled={mutation.isPending}
              aria-invalid={!!form.formState.errors.newPassword} aria-describedby="new-password-help new-password-error"
              {...form.register("newPassword")} />
            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 size-10"
              aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible}
              onClick={() => setVisible(value => !value)}>
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          <p id="new-password-help" className="text-xs text-muted-foreground">Ít nhất 6 ký tự, tối đa 72 byte UTF-8.</p>
          <p id="new-password-error" className="text-xs text-destructive">{form.formState.errors.newPassword?.message}</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Xác nhận mật khẩu mới</label>
          <Input id="confirm-password" type={visible ? "text" : "password"} autoComplete="new-password" className="h-10"
            disabled={mutation.isPending} aria-invalid={!!form.formState.errors.confirmPassword}
            aria-describedby="confirm-password-error" {...form.register("confirmPassword")} />
          <p id="confirm-password-error" className="text-xs text-destructive">{form.formState.errors.confirmPassword?.message}</p>
        </div>
        {form.formState.errors.root?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
        <Button type="submit" className="h-10 w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {mutation.isPending ? "Đang đặt lại mật khẩu..." : "Đặt lại mật khẩu"}
        </Button>
      </form>
      <Link to={authHref("/forgot-password")} className="text-center text-sm text-muted-foreground hover:underline">Yêu cầu liên kết mới</Link>
    </PasswordRecoveryCard>
  );
};
