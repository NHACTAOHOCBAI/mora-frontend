import React, { useState } from 'react';
import { setSessionToken } from '@/features/auth/session';
import { useAdminUsers, useAdminUsersQuery } from '@/features/admin/hooks/useAdminUsers';
import { adminApi } from '@/features/admin/services/admin-api';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api-error';
import CrudTable from '@/components/crud_table/crud-table';
import { userColumns } from './user-columns';
import type { UserResponse, Role } from '@/features/auth/types';
import { useQueryClient } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { PlanTier } from '@/features/billing/services/billing-api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const [editPlan, setEditPlan] = useState<PlanTier>('FREE');
  const planMutation = useMutation({ mutationFn: ({ id, plan }: { id: number; plan: PlanTier }) => adminApi.updateUserPlan(id, plan), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] }) });


  const handleEditClick = (user: UserResponse) => {
    setUserToEdit(user);
    setEditActive(user.active);
    setEditRole(user.role);
    setEditPlan(user.planTier ?? 'FREE');
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
      if (editPlan !== (userToEdit.planTier ?? 'FREE')) await planMutation.mutateAsync({ id: userToEdit.id, plan: editPlan });
      toast.success('Cập nhật thông tin thành viên thành công!');
      setUserToEdit(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteConfirm = async (userId: number) => {
    await deleteUser(userId);
    toast.success('Xóa thành viên thành công!');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    toast.success('Đã tải lại danh sách!');
  };

  const handleImpersonate = async (id: number) => {
    try {
      const response = await adminApi.impersonateUser(id);
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.setItem('originalToken', currentToken);
      }
      setSessionToken(response.token);
      toast.success('Đăng nhập thành công với quyền người dùng!');
      window.location.assign('/');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div>
        <h1 className="type-page-title">Quản lý thành viên</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Danh sách tất cả người dùng hệ thống. Bạn có thể thay đổi vai trò hoặc khóa/mở khóa tài khoản thành viên.
        </p>
      </div>

      <CrudTable<UserResponse>
        columns={userColumns(handleEditClick, handleDeleteConfirm, handleImpersonate)}
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
            <DialogTitle className="type-card-title">Chỉnh sửa thành viên</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Thay đổi vai trò và trạng thái hoạt động của tài khoản người dùng.
            </DialogDescription>
          </DialogHeader>

          {userToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Tài khoản</label>
                <div className="text-sm font-semibold p-2.5 bg-muted/40 border border-border/60 rounded-md">
                  {userToEdit.email} ({userToEdit.fullName})
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Gói sử dụng</label>
                <Select value={editPlan} onValueChange={(val) => setEditPlan(val as PlanTier)}>
                  <SelectTrigger className="w-full border border-border cursor-pointer"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="FREE">Free · 2 Space · 300k token</SelectItem><SelectItem value="PRO">Pro · 10 Space · 3M token</SelectItem><SelectItem value="TEAM">Team · 25 Space · 12M token</SelectItem></SelectContent>
                </Select>
                <p className="type-meta text-muted-foreground">Nâng gói có hiệu lực ngay; hạ gói áp dụng ở chu kỳ tiếp theo.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Vai trò thành viên</label>
                <Select value={editRole} onValueChange={(val) => setEditRole(val as Role)}>
                  <SelectTrigger className="w-full border border-border cursor-pointer">
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
                  <SelectTrigger className="w-full border border-border cursor-pointer">
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
            <Button disabled={planMutation.isPending} onClick={handleSaveEdit} className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
