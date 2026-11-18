import { ErrorView } from "@/components/shared/ErrorView";
import { WifiOff } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Folder,
  FileText,
  Users,
  Search,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { useSpaces, useDeleteSpace, useDashboard, useRespondToMemberInvitation } from "@/features/chat/hooks/useSpace";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { SpaceResponse } from "@/features/chat/types";
import {
  filterAndSortSpaces,
  canDeleteSpace,
} from "@/features/chat/utils/space-list";
import type { SpaceSort } from "@/features/chat/utils/space-list";
import { MemberRoleBadge } from "@/features/chat/components/MemberRoleSelect";
import { CreateSpaceDialog } from "@/features/chat/components/CreateSpaceDialog";
import { MemberConfirmDialog } from "@/features/chat/components/MemberConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api-error";

const dateTime = (value?: string) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })
  : "—";

const processingLabel = { UPLOADING: "Đang tải lên", PARSING: "Đang đọc PDF", INDEXING: "Đang lập chỉ mục" } as const;

export function DashboardPage() {
  const { user } = useAuth();
  const spaces = useSpaces();
  const dashboard = useDashboard();
  const respondInvitation = useRespondToMemberInvitation();
  const remove = useDeleteSpace();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SpaceSort>("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<SpaceResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const visibleSpaces = filterAndSortSpaces(spaces.data || [], search, sort);
  const hasAttention = !!dashboard.data && (dashboard.data.processingDocuments.length > 0 || dashboard.data.pendingMemberInvitations.length > 0);
  const attentionCount = dashboard.data
    ? dashboard.data.processingDocuments.length + dashboard.data.pendingMemberInvitations.length
    : 0;
  const attentionCopy = dashboard.data?.pendingMemberInvitations.length && dashboard.data.processingDocuments.length
    ? { title: "Có gì mới", description: `${attentionCount} cập nhật trong không gian của bạn` }
    : dashboard.data?.pendingMemberInvitations.length
      ? { title: "Lời mời tham gia", description: `${dashboard.data.pendingMemberInvitations.length} lời mời dành cho bạn` }
      : { title: "Tài liệu đang chuẩn bị", description: "Mora đang hoàn tất tài liệu của bạn" };
  const respondToInvitation = (id: number, action: "accept" | "decline") => {
    respondInvitation.mutate(
      { id, action },
      {
        onSuccess: () => toast.success(action === "accept" ? "Đã tham gia không gian" : "Đã từ chối lời mời"),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    );
  };
  const confirmDelete = () => {
    if (!deleting || remove.isPending) return;
    setDeleteError(null);
    remove.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null);
        toast.success("Đã xóa không gian học tập");
      },
      onError: (error) => setDeleteError(getErrorMessage(error)),
    });
  };
  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="type-page-title outline-none"
          >
            Không gian học tập
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-6">
            Quản lý tài liệu, hỏi Mora và ôn tập cùng nhóm.
          </p>
        </div>
        <Button
          ref={createButtonRef}
          onClick={() => setCreateOpen(true)}
          className="h-10 px-4 sm:w-auto w-full"
        >
          <Plus className="size-4" />
          Tạo không gian
        </Button>
      </header>
      {dashboard.isLoading ? (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]" aria-label="Đang tải tổng quan">
          <Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" />
        </section>
      ) : dashboard.isError ? (
        <section className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>Không tải được phần tiếp tục học. Danh sách không gian vẫn có thể sử dụng.</span>
          <Button variant="outline" size="sm" disabled={dashboard.isFetching} onClick={() => void dashboard.refetch()}><RefreshCw className="size-3.5" />Thử lại</Button>
        </section>
      ) : dashboard.data && (dashboard.data.recentSpaces.length > 0 || dashboard.data.processingDocuments.length > 0 || dashboard.data.pendingMemberInvitations.length > 0) ? (
        <section aria-label="Tiếp tục học">
          <div className={`grid gap-4 ${hasAttention ? "lg:grid-cols-[minmax(0,1.65fr)_minmax(19rem,1fr)]" : ""}`}>
            {dashboard.data.recentSpaces.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                {dashboard.data.recentSpaces.slice(0, 1).map((space) => (
                  <Link
                    key={space.id}
                    to={`/space/${space.id}`}
                    className="group block bg-gradient-to-br from-primary/[0.08] via-card to-card p-5 transition-colors hover:from-primary/[0.12] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Folder className="size-5" />
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Tiếp tục học
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                    <div className="mt-7 min-w-0">
                      <p className="type-meta font-medium text-muted-foreground">Không gian hoạt động gần nhất</p>
                      <h3 title={space.name} className="mt-2 truncate type-section-title">{space.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Hoạt động gần nhất {dateTime(space.lastActivityAt || space.updatedAt)}</p>
                    </div>
                    {(typeof space.documentCount === "number" || typeof space.memberCount === "number") && (
                      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        {typeof space.documentCount === "number" && <span className="inline-flex items-center gap-1.5"><FileText className="size-4" />{space.documentCount} tài liệu</span>}
                        {typeof space.memberCount === "number" && <span className="inline-flex items-center gap-1.5"><Users className="size-4" />{space.memberCount} thành viên</span>}
                      </div>
                    )}
                  </Link>
                ))}
                {dashboard.data.recentSpaces.length > 1 && (
                  <div className="grid border-t border-border sm:grid-cols-2">
                    {dashboard.data.recentSpaces.slice(1).map((space) => (
                      <Link key={space.id} to={`/space/${space.id}`} className="group flex min-w-0 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring sm:px-6 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 sm:[&:first-child]:border-r">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><Folder className="size-4" /></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium group-hover:underline">{space.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{dateTime(space.lastActivityAt || space.updatedAt)}</span></span>
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
            {hasAttention && (
              <aside className="rounded-2xl border border-border bg-card p-5" aria-labelledby="attention-heading">
                <div className="flex items-center justify-between gap-3">
                  <div><h3 id="attention-heading" className="type-card-title">{attentionCopy.title}</h3><p className="type-meta mt-1 text-muted-foreground">{attentionCopy.description}</p></div>
                </div>
                <div className="mt-4 space-y-3">
                  {dashboard.data.processingDocuments.map((document) => (
                    <Link key={document.id} to={`/space/${document.spaceId}`} className="group block rounded-xl border border-border/70 bg-muted/30 p-3 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                      <div className="flex items-start gap-3"><span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-background"><FileText className="size-3.5" /></span><span className="min-w-0"><span className="block truncate text-sm font-medium group-hover:underline">{document.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{processingLabel[document.status]} · {document.spaceName}</span></span></div>
                    </Link>
                  ))}
                  {dashboard.data.pendingMemberInvitations.map((invitation) => {
                    const isResponding = respondInvitation.isPending && respondInvitation.variables?.id === invitation.id;
                    return <div key={invitation.id} className="rounded-xl border border-border/70 bg-muted/30 p-3"><p className="truncate text-sm font-medium">{invitation.spaceName}</p><p className="mt-1 text-xs text-muted-foreground">Mời bởi {invitation.inviterName}</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={isResponding} onClick={() => respondToInvitation(invitation.id, "accept")}>{isResponding ? "Đang xử lý..." : "Chấp nhận"}</Button><Button size="sm" variant="outline" disabled={isResponding} onClick={() => respondToInvitation(invitation.id, "decline")}>Từ chối</Button></div></div>;
                  })}
                </div>
              </aside>
            )}
          </div>
        </section>
      ) : null}
      <section className="space-y-4" aria-label="Không gian của bạn">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              aria-label="Tìm không gian"
              placeholder="Tìm không gian theo tên..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-9 bg-card"
            />
          </div>
          <Select
            value={sort}
            onValueChange={(value) => {
              if (value === "newest" || value === "name") setSort(value);
            }}
          >
            <SelectTrigger
              aria-label="Sắp xếp không gian"
              className="w-full sm:w-44"
            >
              <SelectValue>
                {sort === "newest" ? "Mới tạo" : "Tên A–Z"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              <SelectItem value="newest">Mới tạo</SelectItem>
              <SelectItem value="name">Tên A–Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {spaces.isLoading ? (
          <div role="status">
            <span className="sr-only">Đang tải không gian...</span>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              aria-hidden="true"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-card p-4 space-y-4"
                >
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>
        ) : spaces.isError ? (
          <ErrorView illustration="workspace-connection" icon={<WifiOff />}
            title="Không tải được danh sách không gian"
            description="Vui lòng kiểm tra kết nối và thử lại. Các không gian của bạn vẫn được giữ.">
            <Button className="h-10 w-full" disabled={spaces.isFetching} onClick={() => { void spaces.refetch(); }}>
              {spaces.isFetching ? "Đang thử lại..." : "Thử lại"}
            </Button>
          </ErrorView>
        ) : !spaces.data?.length ? (
          <div className="rounded-2xl border border-dashed border-border py-12 px-6 text-center space-y-4">
            <BookOpen className="size-8 mx-auto text-muted-foreground" />
            <h2 className="font-semibold">Chưa có không gian học tập</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-6">
              Tạo không gian đầu tiên để tải tài liệu PDF, hỏi Mora và bắt đầu
              ôn tập.
            </p>
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Tạo không gian đầu tiên
            </Button>
          </div>
        ) : (
          <>
            <p role="status" className="text-xs text-muted-foreground">
              {search.trim()
                ? `${visibleSpaces.length} kết quả`
                : `${spaces.data.length} không gian`}
            </p>
            {!visibleSpaces.length ? (
              <div className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-border">
                <Search className="size-7 mx-auto text-muted-foreground" />
                <h2 className="font-medium">
                  Không tìm thấy không gian phù hợp
                </h2>
                <p className="text-sm text-muted-foreground">
                  Thử tên khác hoặc xóa nội dung tìm kiếm.
                </p>
                <Button variant="outline" onClick={() => setSearch("")}>
                  Xóa tìm kiếm
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {visibleSpaces.map((space) => (
                  <article
                    key={space.id}
                    aria-labelledby={`space-title-${space.id}`}
                    className="group relative min-w-0 rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 hover:border-primary/25 hover:shadow-sm transition-[border-color,box-shadow]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Folder className="size-4" />
                      </span>
                      <div className="flex items-center flex-wrap justify-end gap-2">
                        {space.currentUserRole && (
                          <MemberRoleBadge role={space.currentUserRole} />
                        )}
                        {canDeleteSpace(space, user?.role) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              aria-label={`Thao tác không gian ${space.name}`}
                              className="relative z-10 size-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                            >
                              <MoreHorizontal className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleting(space);
                                }}
                              >
                                <Trash2 className="size-4" />
                                Xóa không gian
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    <div>
                      <h2
                        id={`space-title-${space.id}`}
                        title={space.name}
                        className="text-base font-semibold truncate"
                      >
                        {space.name}
                      </h2>
                      {space.description?.trim() && (
                        <p className="text-sm text-muted-foreground leading-5 mt-1 line-clamp-2 break-words">
                          {space.description}
                        </p>
                      )}
                    </div>
                    {(typeof space.documentCount === "number" ||
                      typeof space.memberCount === "number") && (
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        {typeof space.documentCount === "number" && (
                          <span className="inline-flex items-center gap-1.5">
                            <FileText className="size-3.5" />
                            {space.documentCount} tài liệu
                          </span>
                        )}
                        {typeof space.memberCount === "number" && (
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5" />
                            {space.memberCount} thành viên
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-auto pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">
                        Ngày tạo:{" "}
                        {Number.isFinite(Date.parse(space.createdAt))
                          ? new Date(space.createdAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : "—"}
                      </span>
                      <Link
                        to={`/space/${space.id}`}
                        aria-label={`Mở không gian ${space.name}`}
                        className="inline-flex items-center gap-1 font-medium after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring focus-visible:after:outline-offset-2 group-hover:underline"
                      >
                        Mở không gian
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <CreateSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setSearch("")}
        returnFocus={createButtonRef}
      />
      <MemberConfirmDialog
        open={!!deleting}
        title="Xóa không gian?"
        description={`Không gian “${deleting?.name || ""}” cùng toàn bộ tài liệu và lịch sử chat sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.`}
        actionLabel="Xóa không gian"
        pending={remove.isPending}
        error={deleteError}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        returnFocus={headingRef}
      />
    </div>
  );
}
