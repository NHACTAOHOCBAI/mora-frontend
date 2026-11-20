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
import { CircleHelp, LogOut, ShieldCheck, User, Undo2, Sparkles } from 'lucide-react';
import { useDashboard } from '@/features/chat/hooks/useSpace';
import { useEntitlement } from '@/features/billing/hooks/useEntitlement';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dashboard = useDashboard(!!user);
  const entitlement = useEntitlement(!!user);

  if (!user) return null;

  const originalToken = localStorage.getItem('originalToken');
  const tokenPercent = entitlement.data && entitlement.data.tokenLimit > 0
    ? Math.min(100, Math.round((entitlement.data.tokensUsed / entitlement.data.tokenLimit) * 100))
    : 0;
  const ringColor = tokenPercent >= 100 ? 'var(--destructive)' : tokenPercent >= 80 ? '#f59e0b' : 'var(--foreground)';
  const ringStyle = { background: `conic-gradient(${ringColor} ${tokenPercent}%, var(--muted) 0)` };

  const handleSwitchBack = () => {
    if (originalToken) {
      setSessionToken(originalToken);
      localStorage.removeItem('originalToken');
      window.location.assign('/');
    }
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger render={<DropdownMenuTrigger className="relative inline-flex size-11 cursor-pointer rounded-full p-[2px] transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" style={ringStyle} />}>
          <span className="flex size-full items-center justify-center overflow-hidden rounded-full border border-background bg-muted font-bold text-sm select-none">
            {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || user.email} className="size-full object-cover" /> : toAlias(user.fullName || user.email)}
          </span>
          {(dashboard.data?.pendingMemberInvitationCount ?? 0) > 0 && <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-background bg-destructive" />}
        </TooltipTrigger>
        {entitlement.data && <TooltipContent>Đã dùng {tokenPercent}% quota AI</TooltipContent>}
      </Tooltip>
      <DropdownMenuContent align="end" className="w-60 bg-card border border-border p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left">
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-sm font-medium text-foreground">
                {user.avatarUrl ? <img src={user.avatarUrl} alt={user.fullName || user.email} className="size-full object-cover" /> : toAlias(user.fullName || user.email)}
              </span>
              <div className="grid min-w-0 flex-1 text-sm leading-tight">
                <span className="truncate font-medium">{user.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="my-1 bg-border" />
        {entitlement.data && <><button type="button" onClick={() => navigate('/plans')} className="mx-1 mb-1 block w-[calc(100%-0.5rem)] rounded-md px-2 py-1.5 text-left text-xs leading-5 text-foreground transition-colors hover:bg-muted"><span className="block font-semibold">Gói hiện tại: {entitlement.data.planName}</span><span>Còn {100 - tokenPercent}% hạn mức AI</span></button><DropdownMenuSeparator className="my-1 bg-border" /></>}
        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer font-medium"><User className="mr-2 h-4 w-4" /><span>Thông tin cá nhân</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/plans')} className="cursor-pointer font-medium"><Sparkles className="mr-2 h-4 w-4" /><span>Gói & sử dụng</span></DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/help')} className="cursor-pointer font-medium"><CircleHelp className="mr-2 h-4 w-4" /><span>Trợ giúp</span></DropdownMenuItem>
          {(dashboard.data?.pendingMemberInvitationCount ?? 0) > 0 && <DropdownMenuItem onClick={() => navigate('/app')} className="cursor-pointer font-medium"><User className="mr-2 h-4 w-4" /><span>Lời mời ({dashboard.data?.pendingMemberInvitationCount})</span></DropdownMenuItem>}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 bg-border" />

        {user.role === 'ROLE_ADMIN' && (
          <>
            <DropdownMenuItem
              onClick={() => navigate('/admin')}
              className="cursor-pointer font-medium"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Trung tâm quản trị</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-border" />
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
