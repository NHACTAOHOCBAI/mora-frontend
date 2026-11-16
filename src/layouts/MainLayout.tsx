import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppHeader } from '@/components/shared/AppHeader';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <AppHeader />

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
