import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, ShieldAlert } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Lấy chữ cái đầu tiên của tên để làm avatar đại diện
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors">
        {getInitials(user.fullName || user.username)}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border border-border">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-semibold leading-none">{user.fullName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
                Vai trò: {user.role === 'ROLE_ADMIN' ? 'Admin' : 'User'}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        
        {user.role === 'ROLE_ADMIN' && (
          <>
            <DropdownMenuItem
              onClick={() => navigate('/admin/users')}
              className="cursor-pointer font-medium"
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              <span>Quản lý thành viên</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
          </>
        )}

        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
