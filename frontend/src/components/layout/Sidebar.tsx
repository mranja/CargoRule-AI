'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItem } from '@/types';
import {
  IconBox,
  IconClose,
  IconLogout,
  renderIconByName,
} from '../common/Icons';

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', iconName: 'dashboard' },
  { name: 'Ask CargoRule', href: '/ask', iconName: 'ask', badge: 'AI' },
  { name: 'Documents', href: '/documents', iconName: 'documents' },
  { name: 'Query History', href: '/history', iconName: 'history' },
  { name: 'Countries', href: '/countries', iconName: 'countries' },
  { name: 'Carriers', href: '/carriers', iconName: 'carriers' },
];

const adminNavItems: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', iconName: 'admin', isAdmin: true },
  { name: 'Upload Documents', href: '/admin/upload', iconName: 'upload', isAdmin: true },
  { name: 'Document Management', href: '/admin/documents', iconName: 'docmanage', isAdmin: true },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) {
      return true;
    }
    return pathname === href;
  };

  const renderNavList = (items: NavItem[]) => (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isLinkActive(item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onCloseMobile}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`transition-colors ${
                    active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                  }`}
                >
                  {renderIconByName(item.iconName, { size: 18 })}
                </span>
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col flex-1 h-full">
          {/* Logo Header */}
          <div className="flex h-16 items-center px-6 border-b border-zinc-100 dark:border-zinc-800/60">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <IconBox size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 leading-tight">
                  CargoRule <span className="text-blue-600 dark:text-blue-400">AI</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Logistics Compliance</span>
              </div>
            </Link>
          </div>

          {/* Navigation Content */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin">
            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                Main Navigation
              </div>
              {renderNavList(mainNavItems)}
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between">
                <span>Admin Controls</span>
                <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
              </div>
              {renderNavList(adminNavItems)}
            </div>
          </nav>

          {/* Footer User Profile & Logout */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 font-semibold text-xs dark:bg-zinc-700 dark:text-zinc-200">
                  OP
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    Operations User
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                    ops@cargorule.ai
                  </span>
                </div>
              </div>
              <button
                type="button"
                title="Logout"
                aria-label="Logout"
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                onClick={() => {
                  // Ready for auth logout handler
                }}
              >
                <IconLogout size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile & Tablet Responsive Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <IconBox size={18} />
            </div>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              CargoRule <span className="text-blue-600 dark:text-blue-400">AI</span>
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close Menu"
          >
            <IconClose size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
              Main Navigation
            </div>
            {renderNavList(mainNavItems)}
          </div>

          <div>
            <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-zinc-400 uppercase flex items-center justify-between">
              <span>Admin Controls</span>
              <span className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">ADMIN</span>
            </div>
            {renderNavList(adminNavItems)}
          </div>
        </nav>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-700 font-semibold text-xs dark:bg-zinc-700 dark:text-zinc-200">
                OP
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  Operations User
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  ops@cargorule.ai
                </span>
              </div>
            </div>
            <button
              type="button"
              title="Logout"
              aria-label="Logout"
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            >
              <IconLogout size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
