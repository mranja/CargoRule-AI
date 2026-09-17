'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconBell,
  IconChevronRight,
  IconMenu,
  IconSearch,
  IconLogout,
  IconAdmin,
  IconCheck,
  IconAlertCircle,
  IconTrash,
  IconDocuments,
  IconCarriers,
  IconGlobe,
  IconClose,
} from '../common/Icons';
import { Avatar } from '../ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { getDocuments } from '@/services/api';
import { DocumentRecord } from '@/types';
import {
  MAJOR_COUNTRIES,
  MAJOR_CARRIERS,
  getCountryDisplayName,
} from '@/utils/tradeConstants';
import { CountryFlag } from '../common/CountryFlag';

interface NavbarProps {
  onOpenMobile: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'alert' | 'info';
  isRead: boolean;
  link?: string;
}

const initialNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'EU CBAM Regulation 2026 Indexed',
    description: 'Carbon Border Adjustment Mechanism documentation successfully vectorized.',
    time: '2m ago',
    type: 'success',
    isRead: false,
    link: '/documents',
  },
  {
    id: '2',
    title: 'DHL Hazmat Battery Policy Update',
    description: 'Section 4.2 lithium battery transport criteria revised for international airfreight.',
    time: '1h ago',
    type: 'alert',
    isRead: false,
    link: '/documents',
  },
  {
    id: '3',
    title: 'US CBP Section 321 De Minimis Rule',
    description: 'Commercial customs entry threshold guidelines synchronized.',
    time: '3h ago',
    type: 'info',
    isRead: false,
    link: '/documents',
  },
  {
    id: '4',
    title: 'Maersk Cold-Chain Protocol',
    description: 'Reefer container temperature regulation policies fully ingested.',
    time: 'Yesterday',
    type: 'success',
    isRead: true,
    link: '/documents',
  },
];

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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [allDocs, setAllDocs] = useState<DocumentRecord[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  useEffect(() => {
    let mounted = true;
    async function loadDocs() {
      try {
        const docs = await getDocuments();
        if (mounted && docs) setAllDocs(docs);
      } catch (err) {
        console.warn('Navbar could not load docs cache:', err);
      }
    }
    loadDocs();
    return () => {
      mounted = false;
    };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const matchingDocs = React.useMemo(() => {
    if (!normalizedQuery) return [];
    return allDocs
      .filter((d) => {
        return (
          d.title.toLowerCase().includes(normalizedQuery) ||
          (d.country && d.country.toLowerCase().includes(normalizedQuery)) ||
          (d.carrier && d.carrier.toLowerCase().includes(normalizedQuery)) ||
          (d.type && d.type.toLowerCase().includes(normalizedQuery))
        );
      })
      .slice(0, 4);
  }, [allDocs, normalizedQuery]);

  const matchingCarriers = React.useMemo(() => {
    if (!normalizedQuery) return [];
    return MAJOR_CARRIERS.filter(
      (c) =>
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.type.toLowerCase().includes(normalizedQuery)
    ).slice(0, 3);
  }, [normalizedQuery]);

  const matchingCountries = React.useMemo(() => {
    if (!normalizedQuery) return [];
    return MAJOR_COUNTRIES.filter(
      (c) =>
        c.code !== 'Global' &&
        (c.name.toLowerCase().includes(normalizedQuery) ||
          c.code.toLowerCase() === normalizedQuery ||
          c.region.toLowerCase().includes(normalizedQuery))
    ).slice(0, 3);
  }, [normalizedQuery]);

  const totalResultsCount =
    matchingDocs.length + matchingCarriers.length + matchingCountries.length;

  const executeSearch = (targetQuery?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : searchQuery).trim();
    if (!q) return;

    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');

    if (pathname.startsWith('/carriers')) {
      router.push(`/carriers?search=${encodeURIComponent(q)}`);
    } else if (pathname.startsWith('/countries')) {
      router.push(`/countries?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/documents?search=${encodeURIComponent(q)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSelectDoc = (doc: DocumentRecord) => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
    router.push(`/documents?search=${encodeURIComponent(doc.title)}`);
  };

  const handleSelectCarrier = (carrierName: string) => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
    router.push(`/carriers?search=${encodeURIComponent(carrierName)}`);
  };

  const handleSelectCountry = (countryName: string) => {
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setSearchQuery('');
    router.push(`/countries?search=${encodeURIComponent(countryName)}`);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const toggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    if (!notif.isRead) {
      toggleNotificationRead(notif.id);
    }
    setShowNotifications(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const routeMeta = routeTitles[pathname] || {
    title: 'CargoRule AI',
    breadcrumb: ['Home', 'Dashboard'],
  };

  const displayName = user?.name || (user?.role === 'admin' ? 'Compliance Admin' : 'Operations Specialist');
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CR';

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
        {/* Global Search with Live Predictive Dropdown */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <IconSearch size={15} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
              placeholder="Search regulations or carriers..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title="Clear search"
              >
                <IconClose size={13} />
              </button>
            ) : (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                <kbd className="hidden lg:inline-block rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
                  ↵
                </kbd>
              </div>
            )}
          </form>

          {/* Search Dropdown Results */}
          {isSearchOpen && searchQuery.trim() && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsSearchOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-zinc-200 bg-white shadow-2xl z-40 dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[75vh] overflow-y-auto">
                {totalResultsCount === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      No matching policies, carriers, or countries found.
                    </p>
                    <button
                      type="button"
                      onClick={() => executeSearch()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <span>Search Document Repository for &ldquo;{searchQuery.trim()}&rdquo;</span>
                      <IconChevronRight size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {/* 1. Documents */}
                    {matchingDocs.length > 0 && (
                      <div className="p-2">
                        <span className="px-2 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Regulations & Documents ({matchingDocs.length})
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {matchingDocs.map((doc) => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => handleSelectDoc(doc)}
                              className="w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <IconDocuments size={15} className="shrink-0 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                  {doc.title}
                                </span>
                              </div>
                              <span className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 shrink-0 inline-flex items-center gap-1">
                                <CountryFlag country={doc.country} size="xs" />
                                <span>{doc.type}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Carriers */}
                    {matchingCarriers.length > 0 && (
                      <div className="p-2">
                        <span className="px-2 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Carriers ({matchingCarriers.length})
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {matchingCarriers.map((car) => (
                            <button
                              key={car.id}
                              type="button"
                              onClick={() => handleSelectCarrier(car.name)}
                              className="w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-emerald-50/60 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <IconCarriers size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                                  {car.name}
                                </span>
                              </div>
                              <span className="rounded-md bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                                {car.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Countries */}
                    {matchingCountries.length > 0 && (
                      <div className="p-2">
                        <span className="px-2 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                          Countries ({matchingCountries.length})
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {matchingCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleSelectCountry(c.name)}
                              className="w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <CountryFlag country={c.code} size="sm" />
                                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                                  {c.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-400 shrink-0">
                                {c.region}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer Submit Action */}
                    <div className="p-2 bg-zinc-50/80 dark:bg-zinc-950/50">
                      <button
                        type="button"
                        onClick={() => executeSearch()}
                        className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/60 transition-colors cursor-pointer"
                      >
                        <span>Search &ldquo;{searchQuery.trim()}&rdquo; in Document Repository</span>
                        <IconChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          aria-label="Toggle mobile search"
          className="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 md:hidden rounded-lg dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <IconSearch size={18} />
        </button>

        {/* Notifications Icon Button & Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            aria-label="View notifications"
            className="relative p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 rounded-lg dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <IconBell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white shadow-xl z-40 dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      System Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                        title="Clear all"
                      >
                        <IconTrash size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-400">
                      <IconCheck size={24} className="mx-auto mb-2 text-emerald-500 opacity-60" />
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">No notifications</p>
                      <p className="text-[11px] mt-0.5">All customs & carrier systems are synced.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                          !notif.isRead ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {notif.type === 'alert' ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                              <IconAlertCircle size={14} />
                            </span>
                          ) : notif.type === 'success' ? (
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                              <IconCheck size={14} />
                            </span>
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                              <IconBell size={14} />
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className={`text-xs font-semibold truncate ${
                              !notif.isRead ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-600 dark:text-zinc-400'
                            }`}>
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-zinc-400 shrink-0">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                            {notif.description}
                          </p>
                        </div>

                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-center">
                  <Link
                    href="/documents"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                  >
                    View All Compliance Documents →
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="User Menu"
          >
            <Avatar size="sm" initials={initials} name={displayName} />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] text-zinc-400 capitalize">
                {user?.role || 'user'}
              </span>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg z-40 dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {user?.email}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <IconAdmin size={15} />
                    <span>Admin Console</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <IconLogout size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="absolute left-0 right-0 top-16 border-b border-zinc-200 bg-white p-3 shadow-lg z-30 dark:border-zinc-800 dark:bg-zinc-900 md:hidden animate-in slide-in-from-top-2 duration-150">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
              <IconSearch size={15} />
            </div>
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder="Search regulations, carriers, countries..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-16 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      )}
    </header>
  );
};

export const Header = Navbar;
