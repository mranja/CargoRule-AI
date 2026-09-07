'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { COUNTRIES_LIST } from '@/components/query/CountryFilterSelect';
import { IconArrowRight, IconGlobe, IconSearch } from '@/components/common/Icons';

export default function CountriesPage() {
  const [search, setSearch] = useState('');

  const filteredCountries = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.region && c.region.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Countries Covered
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Inspect region-specific customs requirements, import/export restrictions, and country profiles.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<IconSearch size={16} />}
            />
          </div>
        </div>

        {/* Country Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCountries.map((c) => (
            <Card key={c.code} className="p-5 space-y-4 hover:border-blue-300 dark:hover:border-blue-900 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                    <IconGlobe size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {c.name}
                    </h3>
                    <span className="text-[11px] text-zinc-400 font-medium">{c.region}</span>
                  </div>
                </div>

                <Badge variant="primary" size="md">
                  {c.code}
                </Badge>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-medium">Compliance Coverage Active</span>
                <Link
                  href={`/ask?country=${c.code}`}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <span>Query Rules</span>
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
