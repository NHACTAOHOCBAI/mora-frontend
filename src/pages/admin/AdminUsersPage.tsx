import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminUsers } from '@/features/admin/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, MoreVertical, Shield, UserX, UserCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, isLoading, isError, updateUser, refetch } = useAdminUsers();

  const handleToggleStatus = async (id: number, currentActive: boolean, currentRole: any) => {
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

  const handleChangeRole = async (id: number, currentActive: boolean, newRole: 'ROLE_USER' | 'ROLE_ADMIN') => {
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

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quản Lý Thành Viên</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Danh sách tất cả người dùng hệ thống. Bạn có thể thay đổi vai trò hoặc khóa/mở khóa tài khoản thành viên.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              toast.success('Đã tải lại danh sách!');
            }}
            className="rounded-lg cursor-pointer h-9 px-4 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại dữ liệu
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Đang tải danh sách người dùng...</p>
        </div>
        ) : isError ? (
          <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-2xl text-center">
            <p className="text-destructive font-medium">Lỗi tải danh sách người dùng. Vui lòng kiểm tra lại dịch vụ backend.</p>
          </div>
        ) : (
          <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-[80px] font-bold">ID</TableHead>
                  <TableHead className="font-bold">Tên đăng nhập</TableHead>
                  <TableHead className="font-bold">Họ và tên</TableHead>
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Vai trò</TableHead>
                  <TableHead className="font-bold">Trạng thái</TableHead>
                  <TableHead className="w-[100px] text-right font-bold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30 border-b border-border">
                      <TableCell className="font-medium text-muted-foreground">{user.id}</TableCell>
                      <TableCell className="font-semibold">{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            user.role === 'ROLE_ADMIN'
                              ? 'bg-foreground text-background border-foreground'
                              : 'bg-muted text-foreground border-border'
                          }`}
                        >
                          {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            user.active
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-destructive'}`} />
                          {user.active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted flex items-center justify-center transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Tác vụ thành viên</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-border" />
                            
                            {/* Toggle Active/Inactive */}
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(user.id, user.active, user.role)}
                              className="cursor-pointer"
                            >
                              {user.active ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  <span>Khóa tài khoản</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  <span>Mở khóa tài khoản</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            {/* Toggle Role */}
                            {user.role === 'ROLE_USER' ? (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(user.id, user.active, 'ROLE_ADMIN')}
                                className="cursor-pointer font-medium"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                <span>Gán quyền Admin</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleChangeRole(user.id, user.active, 'ROLE_USER')}
                                className="cursor-pointer"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                <span>Gỡ quyền Admin</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Không tìm thấy người dùng nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
    </div>
  );
};
