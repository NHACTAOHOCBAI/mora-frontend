import { toAlias } from "@/lib/utils";
import React from 'react';
import { setSessionToken } from '@/features/auth/session';
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
import { CircleHelp, LogOut, ShieldAlert, User, Undo2 } from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const originalToken = localStorage.getItem('originalToken');

  const handleSwitchBack = () => {
    if (originalToken) {
      setSessionToken(originalToken);
      localStorage.removeItem('originalToken');
      window.location.assign('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative h-9 w-9 rounded-full bg-muted border border-border flex items-center justify-center font-bold text-sm cursor-pointer select-none hover:bg-accent hover:text-accent-foreground transition-colors overflow-hidden">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.fullName || user.email} className="w-full h-full object-cover" />
        ) : (
          toAlias(user.fullName || user.email)
        )}
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
        
        <DropdownMenuItem
          onClick={() => navigate('/profile')}
          className="cursor-pointer font-medium"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Thông tin cá nhân</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer font-medium">
          <CircleHelp className="mr-2 h-4 w-4" />
          <span>Trợ giúp</span>
        </DropdownMenuItem>

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

        {originalToken && (
          <>
            <DropdownMenuItem
              onClick={handleSwitchBack}
              className="cursor-pointer font-medium text-amber-600 focus:text-amber-700 focus:bg-amber-100 dark:text-amber-500 dark:focus:text-amber-400 dark:focus:bg-amber-900/30"
            >
              <Undo2 className="mr-2 h-4 w-4" />
              <span>Quay lại tài khoản gốc</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
          </>
        )}

        <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Đăng xuất</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
