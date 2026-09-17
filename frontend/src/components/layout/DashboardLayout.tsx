'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar, mainNavItems, adminNavItems } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/context/AuthContext';
import { IconSpinner } from '../common/Icons';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const isChatPage = pathname === '/ask';

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-3 text-sm font-medium">
          <IconSpinner size={20} className="animate-spin text-blue-600" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        mainNavItems={mainNavItems}
        adminNavItems={adminNavItems}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen transition-all duration-200">
        {/* Top Navbar */}
        <Navbar onOpenMobile={() => setIsMobileOpen(true)} />

        {/* Main Content Area */}
        <main
          className={
            isChatPage
              ? 'flex-1 h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden p-3 sm:p-4 max-w-5xl w-full mx-auto flex flex-col'
              : 'flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8'
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
};
