import { Link, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import CrudTable from '@/components/crud_table/crud-table';
import { DataTableColumnHeader } from '@/components/table/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminDocuments } from '@/features/admin/hooks/useAdminOperations';
import type { AdminDocumentSummary, DocumentStatus } from '@/features/admin/services/admin-api';
import { StatusBadge, bytes, dateTime } from './admin-utils';

const statusFilters: Array<{ value: DocumentStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'UPLOADING', label: 'Đang tải lên' },
  { value: 'PARSING', label: 'Đang đọc' },
  { value: 'INDEXING', label: 'Đang lập chỉ mục' },
  { value: 'READY', label: 'Sẵn sàng' },
  { value: 'FAILED', label: 'Thất bại' },
];
const columns: ColumnDef<AdminDocumentSummary>[] = [
  { accessorKey: 'id', header: ({ column }) => <DataTableColumnHeader column={column} title="ID" /> },
  { accessorKey: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Tài liệu" />, cell: ({ row }) => <Link className="font-medium hover:underline" to={`/admin/documents/${row.original.id}`}>{row.original.name}</Link> },
  { accessorKey: 'spaceName', header: ({ column }) => <DataTableColumnHeader column={column} title="Không gian" />, cell: ({ row }) => <Link className="hover:underline" to={`/admin/spaces/${row.original.spaceId}`}>{row.original.spaceName}</Link> },
  { accessorKey: 'uploadedByName', header: ({ column }) => <DataTableColumnHeader column={column} title="Người tải" /> },
  { accessorKey: 'fileSize', header: ({ column }) => <DataTableColumnHeader column={column} title="Dung lượng" />, cell: ({ row }) => bytes(row.original.fileSize) },
  { accessorKey: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Tạo lúc" />, cell: ({ row }) => <span className="text-muted-foreground">{dateTime(row.original.createdAt)}</span> },
  { id: 'detail', header: () => <span className="sr-only">Chi tiết</span>, enableHiding: false, enableSorting: false, cell: ({ row }) => <Button size="sm" variant="ghost" render={<Link to={`/admin/documents/${row.original.id}`} />}>Chi tiết</Button> },
];

export function AdminDocumentsPage() {
  const [params] = useSearchParams(); const [status, setStatus] = useState<DocumentStatus | 'ALL'>((params.get('status') as DocumentStatus) || 'ALL');
  const queryClient = useQueryClient();
  const location = { reload: () => void queryClient.invalidateQueries({ queryKey: ['adminDocuments'] }) };
  const selectedStatus = statusFilters.find((item) => item.value === status);
  return <div className="space-y-4 w-full"><div><h1 className="type-page-title">Tài liệu & xử lý</h1><p className="mt-1 text-sm text-muted-foreground">Quan sát trạng thái pipeline mà không truy cập nội dung tài liệu.</p></div><CrudTable<AdminDocumentSummary> columns={columns} useQuery={useAdminDocuments} filterPlaceholder="Lọc theo tên tài liệu..." extraParams={{ status: status === 'ALL' ? undefined : status }} dependencies={[status]} filterElement={<Select value={status} onValueChange={(value) => setStatus(value as DocumentStatus | 'ALL')}><SelectTrigger className="h-8 w-44 bg-card"><SelectValue>{selectedStatus?.label}</SelectValue></SelectTrigger><SelectContent align="start" alignItemWithTrigger={false}>{statusFilters.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>}><Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => location.reload()}><RefreshCw className="size-4" />Tải lại</Button></CrudTable></div>;
}
