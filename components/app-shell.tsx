"use client";

import type React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Customers' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/change-orders', label: 'Change Orders' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100 md:flex">
      <aside className="w-full bg-slate-950 text-slate-100 md:w-64 md:shrink-0">
        <div className="border-b border-slate-800 px-5 py-4 text-lg font-semibold tracking-tight">
          Change Order Tracker
        </div>

        <nav className="flex gap-2 overflow-x-auto px-3 py-3 md:block md:space-y-1 md:overflow-visible">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors md:block ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
