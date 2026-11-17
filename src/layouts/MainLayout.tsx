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
    </div>
  );
};
