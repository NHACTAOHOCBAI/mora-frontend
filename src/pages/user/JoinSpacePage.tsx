import { ErrorView } from "@/components/shared/ErrorView";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { Users, FileText, UserPlus, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePreviewSpaceInvitation, useJoinSpaceByInviteCode } from "@/features/chat/hooks/useSpace";
import { MemberRoleBadge } from "@/features/chat/components/MemberRoleSelect";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { toast } from "sonner";
import { AppApiError, getErrorMessage } from "@/lib/api-error";

export const JoinSpacePage = () => {
  const { inviteCode = "" } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { data: preview, isLoading, error, refetch, isFetching } = usePreviewSpaceInvitation(inviteCode);
  const joinMutation = useJoinSpaceByInviteCode();
  const handleJoin = () => {
    if (joinMutation.isPending || !preview) return;
    if (preview.isAlreadyMember) {
      navigate(`/space/${preview.spaceId}`, { replace: true });
      return;
    }
    joinMutation.mutate(inviteCode, {
      onSuccess: space => {
        toast.success(`Đã tham gia không gian “${space.name}”`);
        navigate(`/space/${space.id}`, { replace: true });
      },
      onError: err => {
        toast.error(getErrorMessage(err));
        if (err instanceof AppApiError && [1023, 1024].includes(err.code ?? 0)) void refetch();
      },
    });
  };
  const invalid = error instanceof AppApiError &&
    ([1023, 1024].includes(error.code ?? 0) || error.status === 404);
  if (error) {
    return (
      <ErrorView illustration={invalid ? "invitation" : "connection"} icon={<AlertCircle />}
        title={invalid ? "Lời mời không còn hiệu lực" : "Không thể tải lời mời"}
        description={invalid ? "Liên kết không hợp lệ, đã hết hạn hoặc đã bị thu hồi. Hãy liên hệ chủ nhóm để nhận lời mời mới." : "Vui lòng kiểm tra kết nối và thử lại. Phiên đăng nhập của bạn vẫn được giữ."}>
        {!invalid && <Button className="h-10 w-full" disabled={isFetching} onClick={() => { void refetch(); }}>Thử lại</Button>}
        <Button className="h-10 w-full" variant={invalid ? "default" : "ghost"} render={<Link to="/app" />}>Về danh sách không gian</Button>
      </ErrorView>
    );
  }
  return (
    <div className="flex w-full min-w-0 flex-1 items-center justify-center bg-muted/20 p-4 sm:p-8">
      <Card className="w-full max-w-md gap-5 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full border bg-muted/60">
            {isLoading ? <Loader2 className="size-6 animate-spin" /> : <UserPlus className="size-6" />}
          </span>
          <div className="space-y-2">
            <h1 className="type-section-title">{isLoading ? "Đang kiểm tra lời mời..." : "Tham gia không gian học tập"}</h1>
            <p className="type-body-relaxed text-muted-foreground">Kiểm tra thông tin bên dưới trước khi xác nhận tham gia.</p>
          </div>
        </div>
        {preview && (
          <>
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <h2 className="break-words type-card-title">{preview.spaceName}</h2>
              {preview.spaceDescription && <p className="break-words type-body-relaxed text-muted-foreground">{preview.spaceDescription}</p>}
              <div className="flex flex-wrap gap-4 type-meta text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{preview.memberCount} thành viên</span>
                <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5" />{preview.documentCount} tài liệu</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                <span className="min-w-0 break-words text-muted-foreground">Người mời: {preview.inviterName || "Chủ nhóm"}</span>
                <MemberRoleBadge role={preview.role} />
              </div>
            </div>
            {preview.isAlreadyMember && <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 shrink-0" />Bạn đã có quyền truy cập không gian này.</p>}
            <div className="space-y-1 rounded-lg bg-muted/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Bạn đang đăng nhập bằng</p>
              <p className="break-all text-sm font-medium">{user?.email}</p>
              <Button variant="ghost" size="sm" disabled={joinMutation.isPending}
                onClick={() => logout(location.pathname + location.search + location.hash)}>Dùng tài khoản khác</Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="h-10 w-full" disabled={joinMutation.isPending} onClick={handleJoin}>
                {joinMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {joinMutation.isPending ? "Đang tham gia..." : preview.isAlreadyMember ? "Mở không gian" : "Tham gia không gian"}
                {!joinMutation.isPending && <ArrowRight className="size-4" />}
              </Button>
              <Button variant="ghost" className="h-10 w-full" disabled={joinMutation.isPending} render={<Link to="/app" />}>Để sau</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
