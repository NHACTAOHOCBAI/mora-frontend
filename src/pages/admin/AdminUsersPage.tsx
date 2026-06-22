import React from 'react';
import { useAdminUsers, useAdminUsersQuery } from '@/features/admin/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CrudTable from '@/components/crud_table/crud-table';
import { userColumns } from './user-columns';
import type { UserResponse, Role } from '@/features/auth/types';
import { useQueryClient } from '@tanstack/react-query';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAdminUsers();

  const handleToggleStatus = async (id: number, currentActive: boolean, currentRole: Role) => {
    try {
      await updateUser({
        id,
        data: {
          active: !currentActive,
          role: currentRole,
        },
      });
      toast.success('Cập nhật trạng thái người dùng thành công!');
    } catch (err: any) {
      toast.error('Cập nhật thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleChangeRole = async (id: number, currentActive: boolean, newRole: Role) => {
    try {
      await updateUser({
        id,
        data: {
          active: currentActive,
          role: newRole,
        },
      });
      toast.success('Cập nhật vai trò người dùng thành công!');
    } catch (err: any) {
      toast.error('Cập nhật thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    toast.success('Đã tải lại danh sách!');
  };

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="text-2xl font-semibold">Quản Lý Thành Viên</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Danh sách tất cả người dùng hệ thống. Bạn có thể thay đổi vai trò hoặc khóa/mở khóa tài khoản thành viên.
        </p>
      </div>

      <CrudTable<UserResponse>
        columns={userColumns(handleToggleStatus, handleChangeRole)}
        useQuery={useAdminUsersQuery}
        filterPlaceholder="Lọc theo tên, email, họ tên..."
      >
        <Button
          variant="outline"
          size="sm"
          className="ml-2 h-8 cursor-pointer"
          onClick={handleRefresh}
        >
          <RefreshCw className="size-4" />
          Tải lại dữ liệu
        </Button>
      </CrudTable>
    </div>
  );
};
