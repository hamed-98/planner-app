// components/dashboard/shared/CommandPaletteModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';
import { DashboardTab } from '@/types/dashboard';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerZen: () => void;
  onToggleCalendar: () => void;
  onCreateBlankNote: () => void;
  onOpenNotesGraph: () => void;
  onNavigateTab: (tab: DashboardTab) => void;
  playAudioFeedback: (type: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onTriggerZen,
  onToggleCalendar,
  onCreateBlankNote,
  onOpenNotesGraph,
  onNavigateTab,
  playAudioFeedback,
  showToast,
}: CommandPaletteModalProps) {
  const [cmdSearchQuery, setCmdSearchQuery] = useState('');

  const commands = [
    {
      name: '🧘 شروع زنگ تمرکز ذهن و بلوک کایزن (Zen Mode)',
      desc: 'ورود مستقیم به تمرکز بدون حواس‌پرتی و دریافت XP',
      action: () => {
        onTriggerZen();
        onClose();
      },
    },
    {
      name: '📅 تغییر بین تقویم خورشیدی و میلادی',
      desc: 'تغییر نوع تقویم پیش‌فرض در کل سامانه',
      action: () => {
        onToggleCalendar();
        showToast('نوع تقویم تغییر یافت.', 'info');
        onClose();
      },
    },
    {
      name: '⚡ ایجاد یادداشت جدید',
      desc: 'شروع تایپ یک ایده بکر یا پیش‌نویس سریع',
      action: () => {
        onCreateBlankNote();
        onNavigateTab('notes');
        onClose();
      },
    },
    {
      name: '🕸️ نمایش شبکه روابط یادداشت‌ها (Obsidian Mode)',
      desc: 'نگاشت تصویری اتصالات یادداشت‌ها',
      action: () => {
        onOpenNotesGraph();
        onNavigateTab('notes');
        onClose();
      },
    },
    {
      name: '🎯 بورد وظایف و کانبان',
      desc: 'مشاهده ستون کارهای در دست اقدام',
      action: () => {
        onNavigateTab('tasks');
        onClose();
      },
    },
    {
      name: '📊 رصد فاکتورهای سلامت (آب و خواب)',
      desc: 'بررسی الگوهای زیستی و روحی روزانه',
      action: () => {
        onNavigateTab('health');
        onClose();
      },
    },
  ];

  const filtered = commands.filter(
    (c) => c.name.includes(cmdSearchQuery) || c.desc.includes(cmdSearchQuery)
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden text-right block"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="جستجو در قابلیت‌ها و دستورات (Esc برای بستن)..."
                value={cmdSearchQuery}
                onChange={(e) => setCmdSearchQuery(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none focus:outline-none placeholder-slate-400"
              />
              <span className="text-[10px] bg-slate-150 text-slate-500 py-1 px-2.5 rounded-lg font-mono">ESC</span>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              {filtered.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => {
                    cmd.action();
                    playAudioFeedback('done');
                  }}
                  className="w-full text-right p-3 hover:bg-teal-50/50 dark:hover:bg-slate-800/60 rounded-2xl transition-colors cursor-pointer block group text-slate-700 dark:text-slate-300 hover:text-teal-900"
                >
                  <div className="font-extrabold text-xs flex items-center justify-between">
                    <span>{cmd.name}</span>
                    <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-black">
                      اجرا ←
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-450 font-semibold mt-1">{cmd.desc}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}