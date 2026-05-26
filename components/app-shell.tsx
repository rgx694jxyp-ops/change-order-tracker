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
      <aside className="w-full bg-slate-950 text-slate-100 md:flex md:w-64 md:shrink-0 md:flex-col">
        <div className="border-b border-slate-800 px-5 py-4 text-lg font-semibold tracking-tight">
          Change Order Tracker
        </div>

        <div className="flex-1">
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
        </div>

        <div className="border-t border-slate-800 px-5 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Account
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-2 text-xs text-slate-300 md:flex-col md:gap-1.5">
            <Link className="transition-colors hover:text-white" href="/login">
              Sign in
            </Link>
            <Link className="transition-colors hover:text-white" href="/signup">
              Sign up
            </Link>
            <Link className="transition-colors hover:text-white" href="/logout">
              Sign out
            </Link>
          </div>
        </div>
      </aside>

      <main className="flex-1 bg-slate-50 p-4 sm:p-6 md:p-8">{children}</main>
    </div>
  );
}
