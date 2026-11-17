import { Link } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import CrudTable from '@/components/crud_table/crud-table';
import { DataTableColumnHeader } from '@/components/table/data-table-column-header';
import { Button } from '@/components/ui/button';
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

export function AdminSpacesPage() {
  const queryClient = useQueryClient();
  const location = { reload: () => void queryClient.invalidateQueries({ queryKey: ['adminSpaces'] }) };
  return <div className="space-y-4 w-full"><div><h1 className="type-page-title">Không gian học tập</h1><p className="mt-1 text-sm text-muted-foreground">Tra cứu metadata, thành viên và tình trạng học liệu theo Space.</p></div><CrudTable<AdminSpaceSummary> columns={columns} useQuery={useAdminSpaces} filterPlaceholder="Lọc theo Space, mô tả hoặc owner..."><Button variant="outline" size="sm" className="ml-2 h-8" onClick={() => location.reload()}><RefreshCw className="size-4" />Tải lại</Button></CrudTable></div>;
}
