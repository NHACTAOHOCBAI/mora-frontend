import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '@/components/shared/AppHeader';
import { SiteFooter } from '@/components/shared/SiteFooter';

export const MainLayout: React.FC = () => {
  const { pathname } = useLocation();
  const showFooter = pathname === '/app' || pathname === '/profile';
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-200">
      <AppHeader homeHref="/app" />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <Outlet />
      </main>
      {showFooter && <SiteFooter />}
    </div>
  );
};
