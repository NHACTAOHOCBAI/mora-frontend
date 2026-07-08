import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/shared/UserMenu';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import type { SpaceSidebarProps } from '../types';

export const SpaceSidebar: React.FC<SpaceSidebarProps> = ({
  space,
  isSpaceLoading,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}) => {
  if (isSidebarCollapsed) {
    return (
      <aside className="w-16 border-r border-border bg-card flex flex-col items-center py-4 shrink-0 justify-between">
        <div className="flex flex-col items-center gap-4 w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(false)}
            className="cursor-pointer"
            title="Mở rộng thanh bên"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Link to="/">
            <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="w-8 h-px bg-border my-1" />
          <div className="p-2 rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-r border-border bg-card flex flex-col shrink-0">
      {/* Header section */}
      <div className="px-4 h-14 border-b border-border flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link to="/">
            <Button variant="ghost" size="icon" title="Quay lại Dashboard" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-foreground truncate text-sm">
              {isSpaceLoading ? 'Đang tải...' : space?.name}
            </h2>
            <p className="text-[10px] text-muted-foreground truncate">
              {isSpaceLoading ? 'Vui lòng đợi' : space?.description || 'Không gian học tập riêng biệt'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarCollapsed(true)}
          className="cursor-pointer"
          title="Thu nhỏ thanh bên"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Main navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted border border-border text-foreground font-semibold shadow-xs">
          <Sparkles className="w-4 h-4 shrink-0 text-primary animate-pulse" />
          <span className="text-xs">Trợ lý Không gian</span>
        </div>
      </div>

      {/* Footer section */}
      <div className="p-4 border-t border-border flex justify-between items-center bg-muted/20">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">Tài khoản</span>
        <div className="flex items-center gap-2">
          <UserMenu />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
};
