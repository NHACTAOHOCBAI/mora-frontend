import { toAlias } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Link as LinkIcon,
  Loader2,
  LogOut,
  MoreHorizontal,
  Search,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSpaceMembers,
  useUpdateMemberRole,
  useRemoveSpaceMember,
} from "../hooks/useSpace";
import type { SpaceMemberResponse, SpaceRole } from "../types";
import {
  ROLE_DETAILS,
  filterMembers,
  memberName,
} from "../utils/member-management";
import { MemberRoleBadge, MemberRoleSelect } from "./MemberRoleSelect";
import { MemberInvitationPanel } from "./MemberInvitationPanel";
import { AddSpaceMemberForm } from "./AddSpaceMemberForm";
import { MemberConfirmDialog } from "./MemberConfirmDialog";
import { getErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";

interface SpaceMemberModalProps {
  spaceId: number;
  spaceName: string;
  currentUserRole?: SpaceRole;
  currentUserId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function SpaceMemberModal(props: SpaceMemberModalProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85dvh] flex flex-col p-0 gap-0 overflow-hidden bg-card border-border rounded-2xl">
        <MemberManager {...props} />
      </DialogContent>
    </Dialog>
  );
}

function MemberManager({
  spaceId,
  spaceName,
  currentUserRole,
  currentUserId,
  open,
  onOpenChange,
}: SpaceMemberModalProps) {
  const isOwner = currentUserRole === "OWNER";
  const navigate = useNavigate();
  const members = useSpaceMembers(spaceId, { enabled: open });
  const update = useUpdateMemberRole();
  const remove = useRemoveSpaceMember();
  const [view, setView] = useState<"members" | "invite">("members");
  const [method, setMethod] = useState("link");
  const [search, setSearch] = useState("");
  const [roleError, setRoleError] = useState<{
    userId: number;
    message: string;
  } | null>(null);
  const [removing, setRemoving] = useState<SpaceMemberResponse | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, [view]);
  const visibleMembers = filterMembers(
    members.data || [],
    search,
    currentUserId,
  );
  const self = members.data?.find((member) => member.userId === currentUserId);
  const selfLeaving = removing?.userId === currentUserId;
  const changeRole = async (
    member: SpaceMemberResponse,
    role: "EDITOR" | "VIEWER",
  ) => {
    if (role === member.role || update.isPending) return;
    setRoleError(null);
    try {
      await update.mutateAsync({ spaceId, userId: member.userId, role });
      toast.success(
        `Đã đổi quyền của ${memberName(member)} thành ${ROLE_DETAILS[role].label.toLocaleLowerCase("vi")}`,
      );
    } catch (error) {
      setRoleError({ userId: member.userId, message: getErrorMessage(error) });
    }
  };
  const requestRemove = (member: SpaceMemberResponse) => {
    setConfirmError(null);
    setRemoving(member);
  };
  const confirmRemove = () => {
    if (!removing) return;
    setConfirmError(null);
    remove.mutate(
      { spaceId, userId: removing.userId },
      {
        onSuccess: () => {
          setRemoving(null);
          if (selfLeaving) {
            onOpenChange(false);
            navigate("/");
            toast.success("Đã rời không gian");
          } else {
            toast.success(`Đã xóa ${memberName(removing)} khỏi nhóm`);
          }
        },
        onError: (error) => setConfirmError(getErrorMessage(error)),
      },
    );
  };
  return (
    <>
      <DialogHeader className="px-5 sm:px-6 py-3.5 shrink-0 pr-12 text-left">
        <div className="flex items-center gap-2">
          {view === "invite" ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Quay lại danh sách thành viên"
              onClick={() => setView("members")}
            >
              <ArrowLeft className="size-4" />
            </Button>
          ) : null}
          <div className="min-w-0">
            <DialogTitle
              ref={titleRef}
              tabIndex={-1}
              className="text-sm font-semibold outline-none"
            >
              {view === "invite" ? "Mời thành viên" : "Thành viên"}
              {view === "members" && members.data && (
                <span className="ml-1.5 text-muted-foreground font-normal text-xs">
                  {members.data.length}
                </span>
              )}
            </DialogTitle>
            <DialogDescription
              className="text-xs text-muted-foreground truncate mt-0.5"
              title={spaceName}
            >
              {spaceName}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      {view === "members" ? (
        <>
          <div className="p-5 sm:px-6 pb-3 shrink-0 flex flex-col-reverse sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                aria-label="Tìm thành viên"
                placeholder="Tìm tên hoặc tài khoản..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 pl-9"
              />
            </div>
            {isOwner && (
              <Button
                className="h-10"
                onClick={() => {
                  setMethod("link");
                  setView("invite");
                }}
              >
                <UserPlus className="size-4" />
                Mời thành viên
              </Button>
            )}
          </div>
          <div className="min-h-0 overflow-y-auto px-5 sm:px-6 pb-5 space-y-4">
            {members.isLoading ? (
              <div
                role="status"
                className="flex justify-center items-center gap-2 py-12 text-sm text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Đang tải thành viên...
              </div>
            ) : members.isError ? (
              <div
                role="alert"
                className="rounded-xl border p-5 text-center space-y-3"
              >
                <p className="text-sm text-muted-foreground">
                  Không tải được danh sách thành viên.
                </p>
                <Button
                  variant="outline"
                  onClick={() => void members.refetch()}
                >
                  Thử lại
                </Button>
              </div>
            ) : !visibleMembers.length ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "Không tìm thấy thành viên phù hợp."
                    : "Chưa có thành viên trong không gian này."}
                </p>
                {search.trim() && (
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Xóa tìm kiếm
                  </Button>
                )}
              </div>
            ) : (
              <ul
                className="rounded-xl border border-border divide-y divide-border"
                aria-label="Danh sách thành viên"
              >
                {visibleMembers.map((member) => {
                  const name = memberName(member);
                  const isSelf = member.userId === currentUserId;
                  const updating =
                    update.isPending &&
                    update.variables?.userId === member.userId;
                  return (
                    <li
                      key={member.id}
                      className="p-3 sm:p-4 grid grid-cols-[36px_minmax(0,1fr)] sm:grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2"
                    >
                      <Avatar className="size-9 border border-border self-start">
                        <AvatarImage src={member.avatarUrl} alt={name} />
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {toAlias(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium truncate"
                            title={name}
                          >
                            {name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] text-muted-foreground shrink-0 rounded bg-muted px-1.5 py-0.5">
                              Bạn
                            </span>
                          )}
                        </div>
                        {name.toLocaleLowerCase() !==
                          member.email.toLocaleLowerCase() && (
                          <p
                            className="text-xs text-muted-foreground truncate mt-1"
                            title={member.email}
                          >
                            {member.email}
                          </p>
                        )}
                      </div>
                      <div className="col-start-2 sm:col-start-3 flex items-center gap-2 sm:justify-end">
                        {updating && (
                          <Loader2
                            aria-label="Đang lưu quyền"
                            className="size-4 animate-spin shrink-0"
                          />
                        )}
                        {isOwner && member.role !== "OWNER" ? (
                          <MemberRoleSelect
                            value={member.role}
                            onChange={(role) => void changeRole(member, role)}
                            label={`Vai trò của ${name}`}
                            disabled={update.isPending || remove.isPending}
                          />
                        ) : (
                          <MemberRoleBadge role={member.role} />
                        )}
                        {isOwner && member.role !== "OWNER" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={remove.isPending}
                              aria-label={`Thao tác với ${name}`}
                              className="size-8 rounded-lg hover:bg-muted flex items-center justify-center"
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => requestRemove(member)}
                              >
                                Xóa khỏi nhóm
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {roleError?.userId === member.userId && (
                        <p
                          role="alert"
                          className="col-start-2 sm:col-span-2 text-xs text-destructive"
                        >
                          {roleError.message}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer py-1 font-medium hover:text-foreground">
                Các vai trò khác nhau thế nào?
              </summary>
              <dl className="mt-3 space-y-3">
                {(["OWNER", "EDITOR", "VIEWER"] as const).map((role) => (
                  <div key={role}>
                    <dt className="font-medium text-foreground">
                      {ROLE_DETAILS[role].label}
                    </dt>
                    <dd className="mt-1 leading-5">
                      {ROLE_DETAILS[role].description}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
          <footer className="shrink-0 px-5 sm:px-6 py-4 border-t border-border flex flex-wrap gap-3 items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Vai trò của bạn:{" "}
              <span className="font-medium text-foreground">
                {currentUserRole
                  ? ROLE_DETAILS[currentUserRole].label
                  : "Thành viên"}
              </span>
            </span>
            {!isOwner && self && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => requestRemove(self)}
              >
                <LogOut className="size-4" />
                Rời không gian
              </Button>
            )}
          </footer>
        </>
      ) : (
        isOwner && (
          <Tabs
            value={method}
            onValueChange={(value) => setMethod(String(value))}
            className="flex flex-col min-h-0"
          >
            <div className="px-5 sm:px-6 pt-5 shrink-0">
              <TabsList className="w-full h-auto p-1">
                <TabsTrigger
                  value="link"
                  className="flex-1 gap-2 py-2 text-xs sm:text-sm"
                >
                  <LinkIcon className="size-4" />
                  Chia sẻ liên kết
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="flex-1 gap-2 py-2 text-xs sm:text-sm"
                >
                  <UserPlus className="size-4" />
                  Thêm bằng tài khoản
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="overflow-y-auto min-h-0 p-5 sm:p-6">
              <TabsContent value="link" className="m-0">
                <MemberInvitationPanel
                  spaceId={spaceId}
                  open={open && method === "link"}
                />
              </TabsContent>
              <TabsContent value="account" className="m-0">
                <AddSpaceMemberForm
                  spaceId={spaceId}
                  onAdded={() => {
                    setSearch("");
                    setView("members");
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        )
      )}
      <MemberConfirmDialog
        open={!!removing}
        title={selfLeaving ? "Rời không gian?" : "Xóa thành viên khỏi nhóm?"}
        description={
          selfLeaving
            ? `Bạn sẽ mất quyền truy cập vào không gian “${spaceName}”. Bạn có thể tham gia lại khi được thêm hoặc có liên kết mời còn hiệu lực.`
            : `${removing ? memberName(removing) : "Thành viên"} sẽ mất quyền truy cập vào không gian “${spaceName}”. Bạn có thể thêm lại người này sau.`
        }
        actionLabel={selfLeaving ? "Rời không gian" : "Xóa khỏi nhóm"}
        pending={remove.isPending}
        error={confirmError}
        onCancel={() => setRemoving(null)}
        onConfirm={confirmRemove}
        returnFocus={titleRef}
      />
    </>
  );
}
