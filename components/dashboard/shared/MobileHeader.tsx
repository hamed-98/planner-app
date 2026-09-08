// components/dashboard/shared/MobileHeader.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export default function MobileHeader({ isMobileMenuOpen, onToggleMobileMenu }: MobileHeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div
      className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-30 shadow-sm"
      dir="rtl"
    >
      <div
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => router.push('/')}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm shadow-teal-500/10">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div>
          <h1 className="text-sm font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
            سـایـبـان
          </h1>
          <span className="text-[8px] text-teal-600 font-bold block">دستیار فعال 🟢</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
          title="تغییر تم"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        <button
          onClick={onToggleMobileMenu}
          className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors border border-slate-100 dark:border-slate-800 cursor-pointer"
        >
          {isMobileMenuOpen ? 'بستن منو ✕' : 'منوی ابزارها ☰'}
        </button>
      </div>
    </div>
  );
}