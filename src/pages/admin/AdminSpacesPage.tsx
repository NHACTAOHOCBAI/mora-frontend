import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Crown, FileText, Folder, FolderOpen, Grid2X2, List, MoreHorizontal, RefreshCw, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import CrudTable from '@/components/crud_table/crud-table';
import { DataTableColumnHeader } from '@/components/table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSpaces } from '@/features/admin/hooks/useAdminOperations';
import type { AdminSpaceSummary } from '@/features/admin/services/admin-api';
import { dateTime } from './admin-utils';

const columns: ColumnDef<AdminSpaceSummary>[] = [
  { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, cell: ({ row }) => <span className="text-muted-foreground">{row.original.id}</span> },
  { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Không gian" />, cell: ({ row }) => <Link className="font-medium hover:underline" to={`/admin/spaces/${row.original.id}`}>{row.original.name}</Link> },
  { accessorKey: 'ownerName', header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" /> },
  { accessorKey: 'memberCount', header: ({ column }) => <DataTableColumnHeader column={column} title="Thành viên" /> },
  { accessorKey: 'documentCount', header: ({ column }) => <DataTableColumnHeader column={column} title="Tài liệu" /> },
  { accessorKey: 'lastActivityAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Hoạt động gần nhất" />, cell: ({ row }) => <span className="text-muted-foreground">{dateTime(row.original.lastActivityAt)}</span> },
  { id: 'detail', header: () => <span className="sr-only">Chi tiết</span>, enableHiding: false, enableSorting: false, cell: ({ row }) => <Button size="sm" variant="ghost" render={<Link to={`/admin/spaces/${row.original.id}`} />}>Chi tiết</Button> },
];

type ViewMode = 'table' | 'grid';

function SpaceGrid({ spaces, loading }: { spaces: AdminSpaceSummary[]; loading: boolean }) {
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)}</div>;
  if (!spaces.length) return <div className="rounded-xl border border-dashed px-6 py-12 text-center"><FolderOpen className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-medium">Không tìm thấy Space</h2><p className="mt-1 text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm hoặc bộ sắp xếp.</p></div>;
  return <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">{spaces.map((space) => <article key={space.id} className="group relative flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-sm"><div className="flex items-start justify-between gap-2"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted"><Folder className="size-4" /></span><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium"><Crown className="size-3" />{space.ownerName}</span><button aria-label={`Thao tác Space ${space.name}`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"><MoreHorizontal className="size-4" /></button></div></div><div className="min-w-0"><h2 title={space.name} className="truncate text-base font-semibold">{space.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">Không gian học tập được quản lý bởi {space.ownerName}.</p></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><FileText className="size-3.5" />{space.documentCount} tài liệu</span><span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{space.memberCount} thành viên</span></div><div className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground"><span>Ngày tạo: {dateTime(space.createdAt)}</span><Link to={`/admin/spaces/${space.id}`} className="inline-flex shrink-0 items-center gap-1 font-medium text-foreground hover:underline">Mở chi tiết <span aria-hidden="true">→</span></Link></div></article>)}</div>;
}

export function AdminSpacesPage() {
  const [view, setView] = useState<ViewMode>('table');
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['adminSpaces'] });
  return <div className="space-y-4 w-full"><div><h1 className="type-page-title">Không gian học tập</h1><p className="mt-1 text-sm text-muted-foreground">Tra cứu metadata, thành viên và tình trạng học liệu theo Space.</p></div><CrudTable<AdminSpaceSummary> columns={columns} useQuery={useAdminSpaces} filterPlaceholder="Lọc theo Space, mô tả hoặc owner..." renderCustomView={view === 'grid' ? (spaces, loading) => <SpaceGrid spaces={spaces} loading={loading} /> : undefined}><div className="flex items-center rounded-lg border bg-card p-0.5"><Button size="icon-sm" variant={view === 'table' ? 'secondary' : 'ghost'} aria-label="Hiển thị dạng bảng" title="Hiển thị dạng bảng" onClick={() => setView('table')}><List className="size-4" /></Button><Button size="icon-sm" variant={view === 'grid' ? 'secondary' : 'ghost'} aria-label="Hiển thị dạng lưới" title="Hiển thị dạng lưới" onClick={() => setView('grid')}><Grid2X2 className="size-4" /></Button></div><Button variant="outline" size="sm" className="ml-2 h-8" onClick={refresh}><RefreshCw className="size-4" />Tải lại</Button></CrudTable></div>;
}
