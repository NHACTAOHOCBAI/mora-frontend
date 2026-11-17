import { ErrorView } from "@/components/shared/ErrorView";
import { ErrorPageFrame } from "@/components/shared/ErrorPageFrame";
import { LockKeyhole, ShieldCheck, WifiOff } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { authPath, clearReturnTo, pendingReturnTo, rememberReturnTo } from "@/features/auth/utils/auth-redirect";
import { AppApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

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
  <ErrorPageFrame>
    <ErrorView illustration={forbidden ? "forbidden" : "connection"} icon={forbidden ? <LockKeyhole /> : <WifiOff />} code={forbidden ? "403" : undefined}
      title={forbidden ? "Bạn không có quyền truy cập" : "Không thể kiểm tra phiên đăng nhập"}
      description={forbidden ? "Tài khoản này không có quyền thực hiện yêu cầu." : "Vui lòng kiểm tra kết nối và thử lại. Phiên đăng nhập của bạn vẫn được giữ."}>
      {!forbidden && <Button className="h-10 w-full" disabled={pending} onClick={retry}>{pending ? "Đang thử lại..." : "Thử lại"}</Button>}
      <Button className="h-10 w-full" variant={forbidden ? "default" : "ghost"} render={<Link to="/" />}>Về trang chủ</Button>
    </ErrorView>
  </ErrorPageFrame>
);

const LegalAcceptanceGate = () => {
  const auth = useAuth();
  const accept = async () => {
    try {
      await auth.acceptLegalDocuments();
      toast.success("Cảm ơn bạn đã xác nhận các văn bản pháp lý.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  return <ErrorPageFrame>
    <ErrorView illustration="forbidden" icon={<ShieldCheck />} title="Cập nhật điều khoản sử dụng" description="Để tiếp tục dùng Mora, vui lòng đọc và đồng ý với Điều khoản sử dụng cùng Chính sách quyền riêng tư hiện hành.">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <Link className="font-medium underline underline-offset-4" to="/terms">Điều khoản sử dụng</Link>
        <Link className="font-medium underline underline-offset-4" to="/privacy">Chính sách quyền riêng tư</Link>
      </div>
      <Button className="h-10 w-full" disabled={auth.isAcceptingLegalDocuments} onClick={() => { void accept(); }}>
        {auth.isAcceptingLegalDocuments ? "Đang lưu..." : "Tôi đồng ý và tiếp tục"}
      </Button>
      <Button className="h-10 w-full" variant="ghost" onClick={() => auth.logout("/terms")}>Đăng xuất</Button>
    </ErrorView>
  </ErrorPageFrame>;
};

export const ProtectedRoute = ({ requireAdmin = false }: { requireAdmin?: boolean }) => {
  const auth = useAuth();
  const location = useLocation();
  if (!auth.token) return <AuthRedirect signIn target={auth.explicitLogout ? "" : location.pathname + location.search + location.hash} expired={auth.expired} />;
  if (auth.isLoading) return <AuthLoading />;
  const forbidden = auth.error instanceof AppApiError && auth.error.status === 403;
  if (forbidden || (!auth.user && auth.error)) return <SessionError forbidden={forbidden} retry={() => { void auth.retrySession(); }} pending={auth.isFetching} />;
  if (!auth.user) return <AuthLoading />;
  if (auth.user.legalAcceptanceRequired) return <LegalAcceptanceGate />;
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
