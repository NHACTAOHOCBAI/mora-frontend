import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BookOpen, Crown, Link as LinkIcon, Loader2, LockKeyhole, LogOut, MessageSquare, PanelLeft, Save, Settings, Settings2, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorView } from "@/components/shared/ErrorView";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDeleteSpace, useLeaveSpace, useRemoveSpaceMember, useSpaceDetail, useSpaceMembers, useUpdateMemberRole, useUpdateSpace } from "@/features/chat/hooks/useSpace";
import { AddSpaceMemberForm } from "@/features/chat/components/AddSpaceMemberForm";
import { MemberInvitationPanel } from "@/features/chat/components/MemberInvitationPanel";
import { MemberRoleBadge, MemberRoleSelect } from "@/features/chat/components/MemberRoleSelect";
import { filterMembers, memberName, ROLE_DETAILS } from "@/features/chat/utils/member-management";
import type { SpaceMemberResponse } from "@/features/chat/types";
import { getErrorMessage } from "@/lib/api-error";
import { toAlias } from "@/lib/utils";
import { SpaceSidebar } from "@/pages/user/space-detail/components/SpaceSidebar";
import { PdfViewer } from "@/features/chat/components/PdfViewer";
import type { DocumentResponse } from "@/features/chat/services/document-api";

type Section = "general" | "members" | "invites";
const navigation: Array<{ id: Section; label: string; icon: typeof Settings2 }> = [
  { id: "general", label: "Tổng quan", icon: Settings2 },
  { id: "members", label: "Thành viên", icon: Users },
  { id: "invites", label: "Liên kết mời", icon: LinkIcon },
];
const emptyMembers: SpaceMemberResponse[] = [];

export function SpaceSettingsPage() {
  const { spaceId: rawId } = useParams<{ spaceId: string }>();
  const spaceId = Number(rawId);
  const validId = Number.isSafeInteger(spaceId) && spaceId > 0;
  const navigate = useNavigate();
  const { user } = useAuth();
  const spaceQuery = useSpaceDetail(spaceId, { enabled: validId, retry: false });
  const membersQuery = useSpaceMembers(spaceId, { enabled: validId && !!spaceQuery.data });
  const updateSpace = useUpdateSpace();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveSpaceMember();
  const leaveSpace = useLeaveSpace();
  const deleteSpace = useDeleteSpace();
  const [section, setSection] = useState<Section>("general");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [inviteMethod, setInviteMethod] = useState<"link" | "account">("link");
  const [removing, setRemoving] = useState<SpaceMemberResponse | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [successorId, setSuccessorId] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
  const [citationPage, setCitationPage] = useState(1);

  useEffect(() => {
    if (spaceQuery.data) {
      // The draft intentionally refreshes when the server representation changes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(spaceQuery.data.name);
      setDescription(spaceQuery.data.description || "");
    }
  }, [spaceQuery.data]);

  const space = spaceQuery.data;
  const members = membersQuery.data ?? emptyMembers;
  const self = members.find((member) => member.userId === user?.id);
  const canManage = space?.currentUserRole === "OWNER";
  const isDirectOwner = self?.role === "OWNER";
  const visibleMembers = useMemo(() => filterMembers(members, search, user?.id), [members, search, user?.id]);
  const successors = members.filter((member) => member.userId !== user?.id);

  if (!validId || spaceQuery.isError) {
    return <ErrorView icon={<LockKeyhole />} title="Không thể mở cài đặt Space" description="Space không tồn tại hoặc bạn không có quyền truy cập." illustration="workspace-forbidden"><Button render={<Link to="/" />}>Về danh sách không gian</Button></ErrorView>;
  }
  if (!space) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  const saveGeneral = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return toast.error("Tên Space không được để trống");
    updateSpace.mutate({ spaceId, data: { name: trimmedName, description: description.trim() } }, {
      onSuccess: () => toast.success("Đã cập nhật thông tin Space"),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };
  const changeRole = (member: SpaceMemberResponse, role: "EDITOR" | "VIEWER") => {
    updateRole.mutate({ spaceId, userId: member.userId, role }, {
      onSuccess: () => toast.success(`Đã đổi quyền của ${memberName(member)}`),
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };
  const confirmRemove = () => {
    if (!removing) return;
    removeMember.mutate({ spaceId, userId: removing.userId }, {
      onSuccess: () => { toast.success(`Đã xóa ${memberName(removing)} khỏi Space`); setRemoving(null); },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };
  const confirmLeave = () => {
    const successorUserId = isDirectOwner ? Number(successorId) : undefined;
    if (isDirectOwner && (!successorUserId || !successors.some((member) => member.userId === successorUserId))) {
      toast.error("Hãy chọn người kế nhiệm trước khi rời Space");
      return;
    }
    leaveSpace.mutate({ spaceId, successorUserId }, {
      onSuccess: () => { toast.success("Bạn đã rời Space"); navigate("/"); },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };
  const confirmDelete = () => {
    deleteSpace.mutate(spaceId, {
      onSuccess: () => { toast.success("Đã xóa Space"); navigate("/"); },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col overflow-hidden bg-background text-foreground transition-colors duration-200">
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 border-b border-border bg-card px-3 md:flex-nowrap md:px-6">
        <div className="flex h-14 min-w-0 flex-1 items-center gap-2">
          <Button variant="ghost" size="icon" id="space-documents-toggle" aria-label="Đóng/mở tài liệu" aria-expanded={!isSidebarCollapsed} aria-controls="space-documents-sidebar" onClick={() => setIsSidebarCollapsed((value) => !value)}><PanelLeft className="size-4" /></Button>
          <div className="min-w-0 truncate text-sm"><Link to="/" className="text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">Không gian học tập</Link><span className="mx-2 text-muted-foreground" aria-hidden="true">/</span><span className="font-semibold" title={space.name}>{space.name}</span></div>
        </div>
        <nav aria-label="Không gian học" className="order-3 flex h-11 w-full gap-1 md:order-none md:w-auto">
          <Link to={`/space/${spaceId}`} className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 lg:px-4"><MessageSquare className="size-4" />Hỏi đáp</Link>
          <Link to={`/space/${spaceId}?view=study`} className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 lg:px-4"><BookOpen className="size-4" />Ôn tập</Link>
          <Link to={`/space/${spaceId}/settings`} aria-current="page" className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 text-sm font-semibold text-primary transition-colors focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 lg:px-4"><Settings className="size-4" />Cài đặt<span aria-hidden="true" className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-primary" /></Link>
        </nav>
      </div>
      <div className="flex flex-1 min-h-0 relative">
        <SpaceSidebar space={space} isSpaceLoading={spaceQuery.isLoading} isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed} selectedDocumentId={selectedDocument?.id || null} onSelectDocument={setSelectedDocument} currentUserId={user?.id} />
        <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden bg-muted/50 p-3 md:p-5 gap-5">
          <section className={`flex-1 min-w-0 min-h-0 overflow-y-auto rounded-2xl border border-border bg-card max-w-[1200px] mx-auto ${selectedDocument ? "hidden lg:block" : ""}`}>
            <div className="mx-auto w-full max-w-6xl p-5 sm:p-7">
              <header className="mb-6"><h1 className="text-xl font-semibold">Cài đặt Space</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">Quản lý thông tin, thành viên và quyền truy cập của Space tại một nơi.</p></header>
              <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Các mục cài đặt" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:self-start lg:border-r lg:pr-5">
            {navigation.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setSection(id)} aria-current={section === id ? "page" : undefined} className={`relative flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${section === id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"}`}><span aria-hidden="true" className={`absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-opacity ${section === id ? "opacity-100" : "opacity-0"}`} /><Icon className="size-4" />{label}</button>)}
          </nav>
          <section className="min-w-0 rounded-2xl border bg-card shadow-sm">
            {section === "general" && <div className="p-5 sm:p-7"><SectionHeading title="Tổng quan" description="Tên và mô tả giúp mọi người nhận biết đúng Space." />
              <div className="mt-6 max-w-2xl space-y-5">
                <label className="block space-y-2"><span className="text-sm font-medium">Tên Space</span><Input value={name} maxLength={100} disabled={!canManage || updateSpace.isPending} onChange={(event) => setName(event.target.value)} /><span className="text-xs text-muted-foreground">{name.length}/100 ký tự</span></label>
                <label className="block space-y-2"><span className="text-sm font-medium">Mô tả</span><Textarea value={description} maxLength={1024} rows={5} disabled={!canManage || updateSpace.isPending} onChange={(event) => setDescription(event.target.value)} /><span className="text-xs text-muted-foreground">{description.length}/1024 ký tự</span></label>
                {canManage ? <Button disabled={updateSpace.isPending || (name.trim() === space.name && description.trim() === (space.description || ""))} onClick={saveGeneral}>{updateSpace.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{updateSpace.isPending ? "Đang lưu..." : "Lưu thay đổi"}</Button> : <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">Chỉ Owner hoặc quản trị viên hệ thống mới có thể chỉnh sửa thông tin Space.</p>}
              </div>
              <div className="mt-10 border-t border-destructive/30 pt-6"><SectionHeading title="Vùng nguy hiểm" description="Những thao tác này có thể làm bạn mất quyền truy cập hoặc xóa dữ liệu vĩnh viễn." />
                <div className="mt-4 space-y-4"><div className="flex flex-col gap-4 rounded-xl border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Rời Space</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{isDirectOwner ? "Bạn cần chọn người kế nhiệm để chuyển quyền sở hữu trước khi rời." : "Bạn sẽ mất quyền truy cập cho đến khi được mời lại."}</p></div>{self && <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setLeaveOpen(true)}><LogOut className="size-4" />Rời Space</Button>}</div>
                {canManage && <div className="flex flex-col gap-4 rounded-xl border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Xóa Space</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Toàn bộ tài liệu, hội thoại, thành viên và lời mời sẽ bị xóa vĩnh viễn.</p></div><Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" />Xóa Space</Button></div>}</div>
              </div></div>}
            {section === "members" && <div className="p-5 sm:p-7"><SectionHeading title="Thành viên" description="Xem thành viên, phân quyền và mời thêm người vào Space." />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc email..." className="sm:max-w-sm" />{canManage && <Button onClick={() => { setSection("invites"); setInviteMethod("account"); }}><UserPlus className="size-4" />Mời thành viên</Button>}</div>
              <div className="mt-5 overflow-hidden rounded-xl border"><ul className="divide-y">{membersQuery.isLoading ? <li className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline size-4 animate-spin" />Đang tải thành viên...</li> : visibleMembers.map((member) => <li key={member.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><Avatar className="size-10"><AvatarImage src={member.avatarUrl} alt={memberName(member)} /><AvatarFallback>{toAlias(memberName(member))}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{memberName(member)} {member.userId === user?.id && <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">Bạn</span>}</p><p className="truncate text-xs text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2">{canManage && member.role !== "OWNER" ? <MemberRoleSelect value={member.role} label={`Vai trò của ${memberName(member)}`} disabled={updateRole.isPending || removeMember.isPending} onChange={(role) => changeRole(member, role)} /> : <MemberRoleBadge role={member.role} />}{canManage && member.role !== "OWNER" && <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" aria-label={`Xóa ${memberName(member)}`} onClick={() => setRemoving(member)}><Trash2 className="size-4" /></Button>}</div></li>)}</ul></div>
              <details className="mt-5 text-sm text-muted-foreground"><summary className="cursor-pointer font-medium text-foreground">Các vai trò khác nhau thế nào?</summary><div className="mt-3 grid gap-3 sm:grid-cols-3">{(["OWNER", "EDITOR", "VIEWER"] as const).map((role) => <div key={role} className="rounded-lg bg-muted/50 p-3"><p className="font-medium text-foreground">{ROLE_DETAILS[role].label}</p><p className="mt-1 text-xs leading-5">{ROLE_DETAILS[role].description}</p></div>)}</div></details>
            </div>}
            {section === "invites" && <div className="p-5 sm:p-7"><SectionHeading title="Liên kết mời" description="Mời người khác bằng liên kết chia sẻ hoặc tài khoản đã có trên Mora." />{canManage ? <><div className="mt-6 flex gap-2 border-b"><button className={`border-b-2 px-3 pb-3 text-sm font-medium ${inviteMethod === "link" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`} onClick={() => setInviteMethod("link")}>Chia sẻ liên kết</button><button className={`border-b-2 px-3 pb-3 text-sm font-medium ${inviteMethod === "account" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`} onClick={() => setInviteMethod("account")}>Thêm bằng tài khoản</button></div><div className="mt-6 max-w-2xl">{inviteMethod === "link" ? <MemberInvitationPanel spaceId={spaceId} open /> : <AddSpaceMemberForm spaceId={spaceId} onAdded={() => { setSection("members"); setSearch(""); }} />}</div></> : <LockedSection text="Chỉ Owner hoặc quản trị viên hệ thống có thể tạo và xem liên kết mời." />}</div>}
                </section>
              </div>
            </div>
          </section>
          {selectedDocument && <section className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-card"><div className="flex items-center justify-between gap-3 border-b p-3"><span className="truncate text-sm">{selectedDocument.name}</span><Button variant="ghost" size="icon" aria-label="Đóng tài liệu" onClick={() => setSelectedDocument(null)}><X className="size-4" /></Button></div><div className="flex-1 min-h-0"><PdfViewer url={selectedDocument.storageUrl} currentPage={citationPage} onPageChange={setCitationPage} /></div></section>}
        </div>
      </div>
      <AlertDialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa thành viên khỏi Space?</AlertDialogTitle><AlertDialogDescription>{removing && `${memberName(removing)} sẽ mất quyền truy cập vào “${space.name}”.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={removeMember.isPending}>Hủy</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={removeMember.isPending} onClick={confirmRemove}>{removeMember.isPending && <Loader2 className="size-4 animate-spin" />}Xóa khỏi Space</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{isDirectOwner ? "Chuyển quyền và rời Space?" : "Rời Space?"}</AlertDialogTitle><AlertDialogDescription>{isDirectOwner ? "Người kế nhiệm sẽ trở thành Owner của Space. Thao tác này không thể hoàn tác." : `Bạn sẽ mất quyền truy cập vào “${space.name}”.`}</AlertDialogDescription></AlertDialogHeader>{isDirectOwner && <div className="space-y-2"><label htmlFor="successor" className="text-sm font-medium">Người kế nhiệm</label><Select value={successorId} onValueChange={(value) => setSuccessorId(value ?? "")}><SelectTrigger id="successor"><SelectValue placeholder="Chọn một thành viên" /></SelectTrigger><SelectContent>{successors.map((member) => <SelectItem key={member.userId} value={String(member.userId)}>{memberName(member)} · {ROLE_DETAILS[member.role].label}</SelectItem>)}</SelectContent></Select>{!successors.length && <p className="text-sm text-destructive">Hãy thêm ít nhất một thành viên trước khi rời Space.</p>}</div>}<AlertDialogFooter><AlertDialogCancel disabled={leaveSpace.isPending}>Hủy</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={leaveSpace.isPending || (isDirectOwner && !successorId)} onClick={confirmLeave}>{leaveSpace.isPending && <Loader2 className="size-4 animate-spin" />}{isDirectOwner ? "Chuyển quyền và rời" : "Rời Space"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa vĩnh viễn Space?</AlertDialogTitle><AlertDialogDescription>Nhập chính xác tên Space <strong>{space.name}</strong> để xác nhận. Toàn bộ dữ liệu sẽ không thể khôi phục.</AlertDialogDescription></AlertDialogHeader><Input value={deleteName} onChange={(event) => setDeleteName(event.target.value)} aria-label="Xác nhận tên Space" placeholder={space.name} /><AlertDialogFooter><AlertDialogCancel disabled={deleteSpace.isPending}>Hủy</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteSpace.isPending || deleteName !== space.name} onClick={confirmDelete}>{deleteSpace.isPending && <Loader2 className="size-4 animate-spin" />}Xóa vĩnh viễn</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return <header><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></header>;
}

function LockedSection({ text }: { text: string }) {
  return <div className="mt-6 rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground"><Crown className="mb-3 size-5 text-muted-foreground" />{text}</div>;
}
