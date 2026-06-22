import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { UserMenu } from '@/components/shared/UserMenu';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-50 px-6 h-16 flex items-center justify-between shadow-sm shrink-0">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="p-1 bg-muted rounded-lg border border-border flex items-center justify-center w-9 h-9 overflow-hidden">
            <img
              src="/frog-logo.png"
              alt="Mora Logo"
              className="w-7 h-7 object-contain dark:invert"
            />
          </div>
          <span className="font-bold text-lg tracking-wider text-foreground">
            Mora
          </span>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground border-t border-border bg-card/30 shrink-0">
        &copy; {new Date().getFullYear()} Mora. Tất cả các quyền được bảo lưu.
      </footer>
    </div>
  );
};
