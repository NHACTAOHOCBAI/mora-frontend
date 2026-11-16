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
} from "lucide-react";
import { useSpaces, useDeleteSpace } from "@/features/chat/hooks/useSpace";
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

export function DashboardPage() {
  const { user } = useAuth();
  const spaces = useSpaces();
  const remove = useDeleteSpace();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SpaceSort>("newest");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<SpaceResponse | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const visibleSpaces = filterAndSortSpaces(spaces.data || [], search, sort);
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
            className="text-2xl font-semibold tracking-tight outline-none"
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
              className="h-10 data-[size=default]:h-10 w-full sm:w-44 bg-card"
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
          <div
            role="alert"
            className="rounded-2xl border border-border p-8 text-center space-y-3"
          >
            <h2 className="font-medium">Không tải được danh sách không gian</h2>
            <p className="text-sm text-muted-foreground">
              {getErrorMessage(spaces.error)}
            </p>
            <Button variant="outline" onClick={() => void spaces.refetch()}>
              Thử lại
            </Button>
          </div>
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
