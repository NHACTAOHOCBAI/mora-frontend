import { useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authPath, clearReturnTo, pendingReturnTo, rememberReturnTo } from "@/features/auth/utils/auth-redirect";
import { AppApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const AuthLoading = () => (
  <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6">
    <Loader2 className="size-6 animate-spin" /><p className="text-sm text-muted-foreground">Đang kiểm tra phiên đăng nhập...</p>
  </div>
);

const AuthRedirect = ({ target, signIn = false, expired = false }: { target: string; signIn?: boolean; expired?: boolean }) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (signIn) rememberReturnTo(target);
    else clearReturnTo();
    navigate(signIn ? authPath("/login", target, expired) : target, { replace: true });
  }, [target, signIn, expired, navigate]);
  return <AuthLoading />;
};

const SessionError = ({ forbidden, retry, pending }: { forbidden: boolean; retry: () => void; pending: boolean }) => (
  <div className="flex min-h-dvh items-center justify-center bg-background p-6">
    <div className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-6 text-center">
      <h1 className="text-lg font-semibold">{forbidden ? "Bạn không có quyền truy cập" : "Không thể kiểm tra phiên đăng nhập"}</h1>
      <p className="text-sm text-muted-foreground">{forbidden ? "Tài khoản này không có quyền thực hiện yêu cầu." : "Vui lòng kiểm tra kết nối và thử lại. Phiên đăng nhập của bạn vẫn được giữ."}</p>
      {!forbidden && <Button disabled={pending} onClick={retry}>{pending ? "Đang thử lại..." : "Thử lại"}</Button>}
      <Button variant="ghost" render={<Link to="/" />}>Về danh sách không gian</Button>
    </div>
  </div>
);

export const ProtectedRoute = ({ requireAdmin = false }: { requireAdmin?: boolean }) => {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.token) return <AuthRedirect signIn target={auth.explicitLogout ? "" : location.pathname + location.search + location.hash} expired={auth.expired} />;
  if (auth.isLoading) return <AuthLoading />;
  const forbidden = auth.error instanceof AppApiError && auth.error.status === 403;
  if (forbidden || (!auth.user && auth.error)) return <SessionError forbidden={forbidden} retry={() => { void auth.retrySession(); }} pending={auth.isFetching} />;
  if (!auth.user) return <AuthLoading />;
  if (requireAdmin && auth.user.role !== "ROLE_ADMIN") return <SessionError forbidden retry={() => {}} pending={false} />;
  return <Outlet />;
};

export const GuestRoute = () => {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.token) return <Outlet />;
  if (auth.isLoading) return <AuthLoading />;
  const forbidden = auth.error instanceof AppApiError && auth.error.status === 403;
  if (forbidden || (!auth.user && auth.error)) return <SessionError forbidden={forbidden} retry={() => { void auth.retrySession(); }} pending={auth.isFetching} />;
  if (!auth.user) return <AuthLoading />;
  const target = pendingReturnTo(location.search) || (auth.user.role === "ROLE_ADMIN" ? "/admin/users" : "/");
  return <AuthRedirect target={target} />;
};
