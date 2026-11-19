import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, FileText, Folder, Grid2X2, HardDrive, List, MoreHorizontal, RefreshCw, UserRound } from 'lucide-react';
import CrudTable from '@/components/crud_table/crud-table';
import { DataTableColumnHeader } from '@/components/table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminDocuments } from '@/features/admin/hooks/useAdminOperations';
import type { AdminDocumentSummary, DocumentStatus } from '@/features/admin/services/admin-api';
import { StatusBadge, bytes, dateTime } from './admin-utils';

const statusFilters: Array<{ value: DocumentStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả' }, { value: 'UPLOADING', label: 'Đang tải lên' }, { value: 'PARSING', label: 'Đang đọc' },
  { value: 'INDEXING', label: 'Đang lập chỉ mục' }, { value: 'READY', label: 'Sẵn sàng' }, { value: 'FAILED', label: 'Thất bại' },
];

const columns: ColumnDef<AdminDocumentSummary>[] = [
  { id: 'select', header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()} onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)} aria-label="Chọn tất cả" className="translate-y-[2px]" />, cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={value => row.toggleSelected(!!value)} aria-label="Chọn dòng" className="translate-y-[2px]" />, enableSorting: false, enableHiding: false },
  { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />, cell: ({ row }) => <Link className="text-muted-foreground hover:underline" to={`/admin/documents/${row.original.id}`}>{row.original.id}</Link> },
  { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Tài liệu" />, cell: ({ row }) => <Link className="hover:underline" to={`/admin/documents/${row.original.id}`}>{row.original.name}</Link> },
  { accessorKey: 'spaceName', header: ({ column }) => <DataTableColumnHeader column={column} title="Không gian" />, cell: ({ row }) => <Link className="text-muted-foreground hover:underline" to={`/admin/spaces/${row.original.spaceId}`}>{row.original.spaceName}</Link> },
  { accessorKey: 'uploadedByName', header: ({ column }) => <DataTableColumnHeader column={column} title="Người tải" />, cell: ({ row }) => <span className="text-muted-foreground">{row.original.uploadedByName}</span> },
  { accessorKey: 'fileSize', header: ({ column }) => <DataTableColumnHeader column={column} title="Dung lượng" />, cell: ({ row }) => <span className="text-muted-foreground">{bytes(row.original.fileSize)}</span> },
  { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'updatedAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Cập nhật" />, cell: ({ row }) => <span className="text-muted-foreground">{dateTime(row.original.updatedAt || row.original.createdAt)}</span> },
  { id: 'detail', header: () => <div className="pr-4 text-right">Thao tác</div>, enableHiding: false, enableSorting: false, cell: ({ row }) => <div className="pr-4 text-right"><DropdownMenu><DropdownMenuTrigger className="inline-flex size-8 items-center justify-center rounded-lg border border-transparent hover:bg-muted"><span className="sr-only">Thao tác tài liệu</span><MoreHorizontal className="size-4" /></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem className="cursor-pointer" render={<Link to={`/admin/documents/${row.original.id}`} />}>Xem chi tiết</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div> },
];

type ViewMode = 'table' | 'grid';

function DocumentGrid({ documents, loading }: { documents: AdminDocumentSummary[]; loading: boolean }) {
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-52 rounded-2xl" />)}</div>;
  if (!documents.length) return <div className="rounded-xl border border-dashed px-6 py-12 text-center"><FileText className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 font-medium">Không tìm thấy tài liệu</h2><p className="mt-1 text-sm text-muted-foreground">Thử thay đổi từ khóa tìm kiếm hoặc trạng thái xử lý.</p></div>;
  return <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">{documents.map((document) => <article key={document.id} className="group flex min-w-0 gap-4 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-sm"><span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground"><FileText className="size-5" /><span className="mt-0.5 max-w-9 truncate text-[9px] uppercase leading-none">{document.contentType?.split('/').pop() || document.name.split('.').pop() || 'file'}</span></span><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-start justify-between gap-2"><h2 title={document.name} className="min-w-0 truncate pr-1 text-sm font-medium leading-5">{document.name}</h2><StatusBadge status={document.status} /></div><Link to={`/admin/spaces/${document.spaceId}`} className="mt-1.5 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"><Folder className="size-3.5 shrink-0" /><span className="truncate">{document.spaceName}</span></Link><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><HardDrive className="size-3.5" />{bytes(document.fileSize)}</span><span className="inline-flex min-w-0 items-center gap-1"><UserRound className="size-3.5 shrink-0" /><span className="max-w-28 truncate">{document.uploadedByName}</span></span></div><div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span className="inline-flex min-w-0 items-center gap-1"><CalendarDays className="size-3.5" /><span className="truncate">{dateTime(document.updatedAt || document.createdAt)}</span></span><Link to={`/admin/documents/${document.id}`} className="shrink-0 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:underline">Mở <span aria-hidden="true">→</span></Link></div></div></article>)}</div>;
}

export function AdminDocumentsPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<DocumentStatus | 'ALL'>((params.get('status') as DocumentStatus) || 'ALL');
  const [view, setView] = useState<ViewMode>('table');
  const queryClient = useQueryClient();
  const selectedStatus = statusFilters.find((item) => item.value === status);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['adminDocuments'] });
  return <div className="w-full space-y-4"><div><h1 className="type-page-title">Tài liệu & xử lý</h1><p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái xử lý tài liệu trong toàn hệ thống.</p></div><CrudTable<AdminDocumentSummary> columns={columns} useQuery={useAdminDocuments} filterPlaceholder="Lọc theo tên tài liệu..." extraParams={{ status: status === 'ALL' ? undefined : status }} dependencies={[status]} renderCustomView={view === 'grid' ? (documents, loading) => <DocumentGrid documents={documents} loading={loading} /> : undefined} filterElement={<Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus | 'ALL')}><SelectTrigger size="sm" className="w-40"><SelectValue>{selectedStatus?.label}</SelectValue></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{statusFilters.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>}><div className="flex items-center rounded-lg border bg-card p-0.5"><Button size="icon-sm" variant={view === 'table' ? 'secondary' : 'ghost'} aria-label="Hiển thị dạng bảng" title="Hiển thị dạng bảng" onClick={() => setView('table')}><List className="size-4" /></Button><Button size="icon-sm" variant={view === 'grid' ? 'secondary' : 'ghost'} aria-label="Hiển thị dạng lưới" title="Hiển thị dạng lưới" onClick={() => setView('grid')}><Grid2X2 className="size-4" /></Button></div><Button variant="outline" size="sm" className="h-8" onClick={refresh}><RefreshCw className="size-4" />Tải lại</Button></CrudTable></div>;
}
