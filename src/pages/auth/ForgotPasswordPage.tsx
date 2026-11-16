import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, Loader2, MailCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordRecoveryCard } from "@/features/auth/components/PasswordRecoveryCard";
import { forgotPasswordSchema } from "@/features/auth/password-recovery-schema";
import { useForgotPassword } from "@/features/auth/hooks/usePasswordRecovery";
import { AppApiError, getErrorMessage } from "@/lib/api-error";

export const ForgotPasswordPage = () => {
  const mutation = useForgotPassword();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [nextAllowedAt, setNextAllowedAt] = useState(0);
  const [now, setNow] = useState(Date.now);
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" },
  });
  const seconds = Math.max(0, Math.ceil((nextAllowedAt - now) / 1000));
  useEffect(() => {
    if (!nextAllowedAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [nextAllowedAt]);
  const submit = async ({ email }: z.infer<typeof forgotPasswordSchema>) => {
    form.clearErrors("root");
    try {
      await mutation.mutateAsync(email);
      const current = Date.now();
      setNow(current); setNextAllowedAt(current + 60000);
      setSentEmail(email);
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
      if (error instanceof AppApiError && error.status === 429) {
        const current = Date.now();
        setNow(current); setNextAllowedAt(current + 60000);
      }
    }
  };
  return (
    <PasswordRecoveryCard title={sentEmail ? "Kiểm tra email của bạn" : "Quên mật khẩu?"}
      icon={sentEmail ? <MailCheck /> : <KeyRound />}
      description={sentEmail ? "Nếu email này có tài khoản Mora, bạn sẽ nhận được liên kết khôi phục." : "Nhập email tài khoản để nhận liên kết đặt lại mật khẩu."}>
      {sentEmail ? (
        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-4 text-center text-sm space-y-2">
            <p className="break-all font-medium">{sentEmail}</p>
            <p className="text-muted-foreground leading-6">Liên kết có hiệu lực trong 30 phút. Hãy kiểm tra cả thư mục spam.</p>
          </div>
          <Button className="h-10 w-full" disabled={mutation.isPending || seconds > 0}
            onClick={() => void submit({ email: sentEmail })}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {seconds > 0 ? `Gửi lại sau ${seconds} giây` : "Gửi lại liên kết"}
          </Button>
          <Button variant="ghost" className="h-10 w-full" disabled={mutation.isPending}
            onClick={() => { setSentEmail(null); form.clearErrors(); }}>Dùng email khác</Button>
        </div>
      ) : (
        <form onSubmit={event => { void form.handleSubmit(submit)(event); }} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="recovery-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email tài khoản</label>
            <Input id="recovery-email" type="email" autoComplete="email" autoFocus className="h-10"
              placeholder="ban@example.com" disabled={mutation.isPending}
              aria-invalid={!!form.formState.errors.email} aria-describedby="recovery-email-error"
              {...form.register("email")} />
            <p id="recovery-email-error" className="text-xs text-destructive">{form.formState.errors.email?.message}</p>
          </div>
          <Button type="submit" className="h-10 w-full" disabled={mutation.isPending || seconds > 0}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {mutation.isPending ? "Đang gửi yêu cầu..." : seconds > 0 ? `Thử lại sau ${seconds} giây` : "Gửi liên kết khôi phục"}
          </Button>
        </form>
      )}
      {form.formState.errors.root?.message && <p role="alert" className="text-sm text-destructive">{form.formState.errors.root.message}</p>}
      <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
        <ArrowLeft className="size-4" />Quay về đăng nhập
      </Link>
    </PasswordRecoveryCard>
  );
};
