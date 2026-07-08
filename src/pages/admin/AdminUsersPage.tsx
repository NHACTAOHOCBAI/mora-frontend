import React, { useState } from 'react';
import { useAdminUsers, useAdminUsersQuery } from '@/features/admin/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CrudTable from '@/components/crud_table/crud-table';
import { userColumns } from './user-columns';
import type { UserResponse, Role } from '@/features/auth/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { updateUser, deleteUser } = useAdminUsers();

  // Edit Dialog States
  const [userToEdit, setUserToEdit] = useState<UserResponse | null>(null);
  const [editActive, setEditActive] = useState<boolean>(true);
  const [editRole, setEditRole] = useState<Role>('ROLE_USER');

  // Delete Alert States
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);

  const handleEditClick = (user: UserResponse) => {
    setUserToEdit(user);
    setEditActive(user.active);
    setEditRole(user.role);
  };

  const handleSaveEdit = async () => {
    if (!userToEdit) return;
    try {
      await updateUser({
        id: userToEdit.id,
        data: {
          active: editActive,
          role: editRole,
        },
      });
      toast.success('Cập nhật thông tin thành viên thành công!');
      setUserToEdit(null);
    } catch (err: any) {
      toast.error('Cập nhật thất bại: ' + (err.message || 'Lỗi hệ thống'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (userIdToDelete === null) return;
    try {
      await deleteUser(userIdToDelete);
      toast.success('Xóa thành viên thành công!');
      setUserIdToDelete(null);
    } catch (err: any) {
      toast.error('Xóa thất bại: ' + (err.message || 'Lỗi hệ thống'));
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
        columns={userColumns(handleEditClick, setUserIdToDelete)}
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

      {/* Edit User Dialog */}
      <Dialog open={userToEdit !== null} onOpenChange={(open) => !open && setUserToEdit(null)}>
        <DialogContent className="sm:max-w-[450px] border border-border/80 bg-card rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Chỉnh Sửa Thành Viên</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Thay đổi vai trò và trạng thái hoạt động của tài khoản người dùng.
            </DialogDescription>
          </DialogHeader>

          {userToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Tài khoản</label>
                <div className="text-sm font-semibold p-2.5 bg-muted/40 border border-border/60 rounded-md">
                  {userToEdit.username} ({userToEdit.fullName})
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Vai trò thành viên</label>
                <Select value={editRole} onValueChange={(val) => setEditRole(val as Role)}>
                  <SelectTrigger className="w-full h-10 border border-border cursor-pointer bg-background">
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROLE_USER">User (Thành viên)</SelectItem>
                    <SelectItem value="ROLE_ADMIN">Admin (Quản trị viên)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Trạng thái hoạt động</label>
                <Select value={editActive ? "true" : "false"} onValueChange={(val) => setEditActive(val === "true")}>
                  <SelectTrigger className="w-full h-10 border border-border cursor-pointer bg-background">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Khóa tài khoản</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserToEdit(null)} className="cursor-pointer border-border/80">
              Hủy bỏ
            </Button>
            <Button onClick={handleSaveEdit} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User AlertDialog */}
      <AlertDialog open={userIdToDelete !== null} onOpenChange={(open) => !open && setUserIdToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn tài khoản thành viên này cùng toàn bộ các không gian học tập, tài liệu và lịch sử chat liên quan. Không thể hoàn tác hành động này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Hủy bỏ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
