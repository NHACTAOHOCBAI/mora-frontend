import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  Crown,
  Edit3,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePreviewSpaceInvitation, useJoinSpaceByInviteCode } from '@/features/chat/hooks/useSpace';
import { toast } from 'sonner';

export const JoinSpacePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();

  const { data: preview, isLoading, error } = usePreviewSpaceInvitation(inviteCode || '');
  const joinMutation = useJoinSpaceByInviteCode();

  const handleJoin = () => {
    if (!inviteCode) return;

    joinMutation.mutate(inviteCode, {
      onSuccess: (space) => {
        toast.success(`Đã gia nhập Không gian "${space.name}" thành công!`);
        navigate(`/space/${space.id}`);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Gia nhập Không gian thất bại');
      },
    });
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-xs">
            <Crown className="w-3.5 h-3.5" /> Chủ nhóm (Owner)
          </Badge>
        );
      case 'EDITOR':
        return (
          <Badge className="bg-primary/15 text-primary border-primary/30 gap-1 text-xs">
            <Edit3 className="w-3.5 h-3.5" /> Cộng tác viên (Editor)
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
            <Eye className="w-3.5 h-3.5" /> Người xem (Viewer)
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          Đang kiểm tra thông tin mã mời...
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground">
        <Card className="max-w-md w-full border-border bg-card shadow-lg text-center p-6">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg font-bold text-foreground">
            Mã mời không hợp lệ hoặc đã hết hạn
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-2">
            Mã mời này có thể đã bị hủy, hết thời hạn hoặc liên kết không chính xác. Vui lòng liên hệ chủ sở hữu Không gian để nhận mã mới.
          </CardDescription>
          <CardFooter className="flex justify-center mt-6 p-0">
            <Link to="/">
              <Button variant="outline" className="cursor-pointer text-xs">
                Quay về Dashboard
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col items-center justify-center p-6 text-foreground">
      <Card className="max-w-md w-full border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="h-2 bg-primary w-full" />
        
        <CardHeader className="text-center pt-8 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Lời Mời Gia Nhập Không Gian
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Bạn được mời tham gia Không gian học tập cộng tác trên Mora
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6">
          {/* Space Card Preview */}
          <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
            <div>
              <h3 className="text-base font-bold text-foreground truncate">
                {preview.spaceName}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {preview.spaceDescription || 'Không gian học tập và nghiên cứu dùng chung.'}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-primary" />
                {preview.memberCount} thành viên
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="w-4 h-4 text-primary" />
                {preview.documentCount} tài liệu
              </span>
            </div>
          </div>

          {/* Inviter & Role info */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={preview.inviterAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
                  {(preview.inviterName || 'User').substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Người mời</p>
                <p className="font-semibold text-foreground truncate">{preview.inviterName || 'Thành viên nhóm'}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground mb-0.5">Vai trò nhận</p>
              {getRoleBadge(preview.role)}
            </div>
          </div>

          {preview.isAlreadyMember && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Bạn hiện đã là thành viên của Không gian này.</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-6 pt-2">
          <Button
            onClick={handleJoin}
            disabled={joinMutation.isPending}
            className="w-full h-10 font-bold text-xs gap-2 cursor-pointer shadow-md"
          >
            {joinMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {preview.isAlreadyMember ? 'Truy cập Không gian ngay' : 'Xác nhận Tham gia Không gian'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <Link to="/" className="w-full">
            <Button variant="ghost" className="w-full text-xs text-muted-foreground cursor-pointer">
              Bỏ qua & Quay về Trang chủ
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};
export default JoinSpacePage;
