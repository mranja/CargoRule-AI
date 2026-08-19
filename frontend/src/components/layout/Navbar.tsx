'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  IconBell,
  IconChevronRight,
  IconMenu,
  IconSearch,
} from '../common/Icons';
import { Avatar } from '../ui/Avatar';

interface NavbarProps {
  onOpenMobile: () => void;
}

const routeTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  '/': { title: 'Compliance Dashboard', breadcrumb: ['Home', 'Dashboard'] },
  '/dashboard': { title: 'Compliance Dashboard', breadcrumb: ['Home', 'Dashboard'] },
  '/ask': { title: 'Ask CargoRule AI', breadcrumb: ['Home', 'Ask CargoRule'] },
  '/documents': { title: 'Document Repository', breadcrumb: ['Home', 'Documents'] },
  '/history': { title: 'Query History', breadcrumb: ['Home', 'Query History'] },
  '/countries': { title: 'Countries Covered', breadcrumb: ['Home', 'Countries'] },
  '/carriers': { title: 'Carriers Covered', breadcrumb: ['Home', 'Carriers'] },
  '/admin': { title: 'Admin Overview', breadcrumb: ['Home', 'Admin', 'Overview'] },
  '/admin/upload': { title: 'Upload Compliance Documents', breadcrumb: ['Home', 'Admin', 'Upload Documents'] },
  '/admin/documents': { title: 'Document Management', breadcrumb: ['Home', 'Admin', 'Document Management'] },
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobile }) => {
  const pathname = usePathname();
  const routeMeta = routeTitles[pathname] || {
    title: 'CargoRule AI',
    breadcrumb: ['Home', 'Dashboard'],
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
      {/* Left Area: Mobile Menu Toggle & Title / Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobile}
          className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Open sidebar menu"
        >
          <IconMenu size={20} />
        </button>

        <div className="flex flex-col">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 mb-0.5">
            {routeMeta.breadcrumb.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <IconChevronRight size={12} className="text-zinc-300 dark:text-zinc-600" />}
                <span className={idx === routeMeta.breadcrumb.length - 1 ? 'font-medium text-zinc-600 dark:text-zinc-300' : ''}>
                  {item}
                </span>
              </React.Fragment>
            ))}
          </nav>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
            {routeMeta.title}
          </h1>
        </div>
      </div>

      {/* Right Area: Global Search, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Input Trigger */}
        <div className="relative hidden md:block w-56 lg:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <IconSearch size={16} />
          </div>
          <input
            type="search"
            placeholder="Search regulations or carriers..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <kbd className="hidden lg:inline-block rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Mobile Search Button Icon */}
        <button
          type="button"
          aria-label="Global search"
          className="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 md:hidden rounded-lg dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <IconSearch size={18} />
        </button>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="View notifications"
          className="relative p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 rounded-lg dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
        >
          <IconBell size={18} />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
        </button>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* User Profile Avatar Link */}
        <Link
          href="/admin"
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="User Profile"
        >
          <Avatar size="sm" initials="OP" name="Operations Lead" />
          <span className="hidden sm:inline-block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Ops Lead
          </span>
        </Link>
      </div>
    </header>
  );
};

export const Header = Navbar;
