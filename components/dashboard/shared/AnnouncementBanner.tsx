// components/dashboard/shared/AnnouncementBanner.tsx
'use client';

import React from 'react';
import { Bell, X } from 'lucide-react';
import { Announcement } from '@/types/dashboard';

interface AnnouncementBannerProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export default function AnnouncementBanner({ announcement, onClose }: AnnouncementBannerProps) {
  if (!announcement || !announcement.show) return null;

  const typeStyle =
    announcement.type === 'success'
      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
      : announcement.type === 'warning'
      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
      : announcement.type === 'error'
      ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
      : 'bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';

  return (
    <div className={`mb-3 p-4 rounded-2xl border flex items-start sm:items-center gap-3 text-sm font-medium shadow-sm ${typeStyle}`} dir="rtl">
      <Bell className="w-5 h-5 shrink-0 mt-0.5 sm:mt-0 animate-pulse" />
      <div className="flex-1 leading-relaxed">{announcement.text}</div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0 cursor-pointer"
      >
        <X className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
}