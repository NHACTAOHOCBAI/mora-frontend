import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Link as LinkIcon,
  Trash2,
  Copy,
  Check,
  Crown,
  Eye,
  Edit3,
  Loader2,
  Clock,
  LogOut,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSpaceMembers,
  useAddSpaceMember,
  useUpdateMemberRole,
  useRemoveSpaceMember,
  useSpaceInvitations,
  useCreateSpaceInvitation,
  useRevokeSpaceInvitation,
} from '../hooks/useSpace';
import type { SpaceRole } from '../types';
import { toast } from 'sonner';

interface SpaceMemberModalProps {
  spaceId: number;
  spaceName: string;
  currentUserRole?: SpaceRole;
  currentUserId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SpaceMemberModal: React.FC<SpaceMemberModalProps> = ({
  spaceId,
  spaceName,
  currentUserRole,
  currentUserId,
  open,
  onOpenChange,
}) => {
  const isOwner = currentUserRole === 'OWNER';

  // Members
  const { data: members = [], isLoading: isMembersLoading } = useSpaceMembers(spaceId);
  const addMemberMutation = useAddSpaceMember();
  const updateRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveSpaceMember();

  // Invitations
  const { data: invitations = [], isLoading: isInvitationsLoading } = useSpaceInvitations(spaceId);
  const createInviteMutation = useCreateSpaceInvitation();
  const revokeInviteMutation = useRevokeSpaceInvitation();

  // Add Member form state
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<SpaceRole>('EDITOR');

  // Create Invite form state
  const [inviteRole, setInviteRole] = useState<SpaceRole>('EDITOR');
  const [inviteDuration, setInviteDuration] = useState<string>('7');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim()) {
      toast.error('Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }

    addMemberMutation.mutate(
      {
        spaceId,
        data: { usernameOrEmail: usernameOrEmail.trim(), role: selectedRole },
      },
      {
        onSuccess: (newMember) => {
          toast.success(`Đã thêm ${newMember.fullName || newMember.username} vào nhóm!`);
          setUsernameOrEmail('');
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể thêm thành viên');
        },
      }
    );
  };

  const handleUpdateRole = (userId: number, role: SpaceRole) => {
    updateRoleMutation.mutate(
      { spaceId, userId, role },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật vai trò thành công!');
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể cập nhật vai trò');
        },
      }
    );
  };

  const handleRemoveMember = (userId: number, isSelf: boolean) => {
    const confirmMsg = isSelf
      ? 'Bạn có chắc chắn muốn rời khỏi Không gian học tập này?'
      : 'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?';

    if (confirm(confirmMsg)) {
      removeMemberMutation.mutate(
        { spaceId, userId },
        {
          onSuccess: () => {
            toast.success(isSelf ? 'Đã rời khỏi Không gian' : 'Đã xóa thành viên khỏi nhóm');
            if (isSelf) {
              onOpenChange(false);
              window.location.href = '/';
            }
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Thao tác thất bại');
          },
        }
      );
    }
  };

  const handleCreateInvite = () => {
    const durationDays = parseInt(inviteDuration, 10);
    createInviteMutation.mutate(
      {
        spaceId,
        data: {
          role: inviteRole,
          durationDays: isNaN(durationDays) ? undefined : durationDays,
        },
      },
      {
        onSuccess: (inv) => {
          toast.success('Đã tạo mã mời mới thành công!');
          handleCopyLink(inv.inviteCode);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Không thể tạo mã mời');
        },
      }
    );
  };

  const handleCopyLink = (inviteCode: string) => {
    const joinUrl = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(joinUrl);
    setCopiedCode(inviteCode);
    toast.success('Đã sao chép liên kết tham gia vào clipboard!');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleRevokeInvite = (invitationId: number) => {
    if (confirm('Bạn có chắc chắn muốn hủy liên kết mời này?')) {
      revokeInviteMutation.mutate(
        { spaceId, invitationId },
        {
          onSuccess: () => {
            toast.success('Đã hủy mã mời');
          },
          onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Hủy mã mời thất bại');
          },
        }
      );
    }
  };

  const getRoleBadge = (role: SpaceRole) => {
    switch (role) {
      case 'OWNER':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-semibold hover:bg-amber-500/20">
            <Crown className="w-3 h-3" /> Chủ nhóm
          </Badge>
        );
      case 'EDITOR':
        return (
          <Badge className="bg-primary/15 text-primary border-primary/30 gap-1 text-[11px] font-semibold hover:bg-primary/20">
            <Edit3 className="w-3 h-3" /> Cộng tác
          </Badge>
        );
      case 'VIEWER':
        return (
          <Badge variant="outline" className="text-muted-foreground gap-1 text-[11px] font-medium">
            <Eye className="w-3 h-3" /> Người xem
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Thành viên & Quyền cộng tác
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Không gian: <span className="font-semibold text-foreground">{spaceName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Tabs */}
        <Tabs defaultValue="members" className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pt-3 border-b border-border shrink-0">
            <TabsList className="flex w-full bg-muted/60 p-1.5 rounded-xl h-12">
              <TabsTrigger value="members" className="flex-1 text-xs font-semibold gap-1.5 cursor-pointer data-active:shadow-sm rounded-lg">
                <Users className="w-3.5 h-3.5" />
                Thành viên ({members.length})
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger value="add" className="flex-1 text-xs font-semibold gap-1.5 cursor-pointer data-active:shadow-sm rounded-lg">
                  <UserPlus className="w-3.5 h-3.5" />
                  Thêm trực tiếp
                </TabsTrigger>
              )}
              {isOwner && (
                <TabsTrigger value="invite" className="flex-1 text-xs font-semibold gap-1.5 cursor-pointer data-active:shadow-sm rounded-lg">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Liên kết mời
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* TAB 1: DANH SÁCH THÀNH VIÊN */}
          <TabsContent value="members" className="flex-1 overflow-y-auto p-5 space-y-3 m-0">
            {isMembersLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Đang tải danh sách thành viên...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-xs">
                Chưa có thành viên nào trong Không gian này.
              </div>
            ) : (
              members.map((member) => {
                const isMemberSelf = member.userId === currentUserId;
                const isMemberOwner = member.role === 'OWNER';

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="w-9 h-9 border border-border">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {(member.fullName || member.username).substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {member.fullName || member.username}
                          </span>
                          {isMemberSelf && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                              Bạn
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          @{member.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner && !isMemberOwner ? (
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleUpdateRole(member.userId, val as SpaceRole)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger className="h-7 text-xs w-28 bg-card border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EDITOR" className="text-xs">
                              Cộng tác (Editor)
                            </SelectItem>
                            <SelectItem value="VIEWER" className="text-xs">
                              Người xem (Viewer)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        getRoleBadge(member.role)
                      )}

                      {/* Remove or Leave button */}
                      {((isOwner && !isMemberOwner) || (!isOwner && isMemberSelf)) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.userId, isMemberSelf)}
                          disabled={removeMemberMutation.isPending}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer rounded-lg"
                          title={isMemberSelf ? 'Rời khỏi không gian' : 'Xóa thành viên'}
                        >
                          {isMemberSelf ? <LogOut className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* TAB 2: THÊM THÀNH VIÊN TRỰC TIẾP */}
          {isOwner && (
            <TabsContent value="add" className="flex-1 overflow-y-auto p-5 m-0 space-y-4">
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Tên đăng nhập (Username) hoặc Email
                  </label>
                  <Input
                    placeholder="ví dụ: nguyenvana hoặc email@example.com"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="text-xs h-9 bg-card border-border"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Thành viên cần có tài khoản đã đăng ký trên Mora.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Vai trò trong Không gian
                  </label>
                  <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as SpaceRole)}>
                    <SelectTrigger className="w-full h-9 text-xs bg-card border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDITOR" className="text-xs">
                        <span className="font-semibold text-foreground">Cộng tác viên (Editor)</span>
                      </SelectItem>
                      <SelectItem value="VIEWER" className="text-xs">
                        <span className="font-semibold text-foreground">Người xem (Viewer)</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Dynamic description based on selectedRole */}
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {selectedRole === 'EDITOR' 
                      ? "Cộng tác viên: Được tải lên tài liệu, hỏi đáp AI và tham gia chat nhóm."
                      : "Người xem: Chỉ đọc tài liệu và hỏi đáp AI, không tải lên hay xóa tài liệu."}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={addMemberMutation.isPending || !usernameOrEmail.trim()}
                  className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer mt-2"
                >
                  {addMemberMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  Thêm thành viên ngay
                </Button>
              </form>
            </TabsContent>
          )}

          {/* TAB 3: LIÊN KẾT MỜI */}
          {isOwner && (
            <TabsContent value="invite" className="flex-1 overflow-y-auto p-5 m-0 space-y-4">
              <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-3">
                <span className="text-xs font-bold text-foreground block">
                  Tạo liên kết mời mới
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Vai trò mặc định
                    </label>
                    <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as SpaceRole)}>
                      <SelectTrigger className="w-full h-8 text-xs bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EDITOR" className="text-xs">Cộng tác (Editor)</SelectItem>
                        <SelectItem value="VIEWER" className="text-xs">Người xem (Viewer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Thời hạn hiệu lực
                    </label>
                    <Select value={inviteDuration} onValueChange={(val) => val && setInviteDuration(val)}>
                      <SelectTrigger className="w-full h-8 text-xs bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7" className="text-xs">7 ngày</SelectItem>
                        <SelectItem value="30" className="text-xs">30 ngày</SelectItem>
                        <SelectItem value="0" className="text-xs">Vĩnh viễn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleCreateInvite}
                  disabled={createInviteMutation.isPending}
                  className="w-full h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  {createInviteMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LinkIcon className="w-3.5 h-3.5" />
                  )}
                  Tạo & Sao chép liên kết mời
                </Button>
              </div>

              {/* Active invitations list */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Mã mời đang hoạt động
                </span>

                {isInvitationsLoading ? (
                  <div className="text-center py-4 text-xs text-muted-foreground">Đang tải...</div>
                ) : invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    Chưa có liên kết mời nào đang hoạt động.
                  </div>
                ) : (
                  invitations
                    .filter((i) => i.status === 'PENDING')
                    .map((inv) => {
                      const isCopied = copiedCode === inv.inviteCode;
                      const expiresText = inv.expiresAt
                        ? `Hết hạn: ${new Date(inv.expiresAt).toLocaleDateString('vi-VN')}`
                        : 'Không thời hạn';

                      return (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card gap-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                              <span>{inv.inviteCode}</span>
                              {getRoleBadge(inv.role)}
                            </div>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {expiresText}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyLink(inv.inviteCode)}
                              className="h-7 text-[11px] gap-1 cursor-pointer"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              {isCopied ? 'Đã chép' : 'Sao chép'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeInvite(inv.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive cursor-pointer rounded-lg"
                              title="Hủy mã mời"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
