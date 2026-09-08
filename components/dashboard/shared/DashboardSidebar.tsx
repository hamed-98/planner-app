// components/dashboard/shared/DashboardSidebar.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Grid,
  Calendar,
  BookOpen,
  CheckSquare,
  Activity,
  Brain,
  Settings,
  MessageSquare,
  Moon,
  LogOut,
} from 'lucide-react';
import { DashboardTab } from '@/types/dashboard';

interface DashboardSidebarProps {
  userName: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  eventsCount: number;
  pendingTasksCount: number;
  hasUnreadTickets: boolean;
  level: number;
  title: string;
  xp: number;
  progressPercent: number;
  xpRemaining: number;
  isMobileOpen: boolean;
  onOpenZen: () => void;
  onOpenQuickAdd: () => void;
  onOpenLogout: () => void;
}

export default function DashboardSidebar({
  userName,
  activeTab,
  onTabChange,
  eventsCount,
  pendingTasksCount,
  hasUnreadTickets,
  level,
  title,
  xp,
  progressPercent,
  xpRemaining,
  isMobileOpen,
  onOpenZen,
  onOpenQuickAdd,
  onOpenLogout,
}: DashboardSidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-72 bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 flex flex-col justify-between p-6 shrink-0 shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:flex md:shadow-sm md:h-full md:overflow-y-auto ${
        isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}
      dir="rtl"
    >
      <div>
        {/* نشان و هویت */}
        <div
          className="flex items-center gap-3 mb-5 pb-2 border-b border-slate-50 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              سـایـبـان
            </h2>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              برنامه‌ریز و دستیار پیشرفته سلامت
            </p>
          </div>
        </div>

        {/* کارت پروفایل و وضعیت لول */}
        <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-4 mb-8 space-y-3 border border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-teal-500/10">
              {userName[0]}
            </div>
            <div className="flex-1 text-right">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">{userName}</h4>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-lg">
                  سطح {level}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                {title} <span className="text-slate-400 font-bold">(سطح {level})</span>
              </span>
              <span className="text-[11px] font-black text-indigo-500 dark:text-indigo-400">کل: {xp} XP</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-teal-400 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed text-center font-bold">
              🔥 فقط <span className="text-teal-600 dark:text-teal-400">{xpRemaining} XP</span> تا ارتقا به سطح{' '}
              {level + 1}
            </p>
          </div>
        </div>

        {/* لینک‌های ناوبری */}
        <nav className="space-y-1.5">
          <button
            type="button"
            onClick={() => onTabChange('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Grid className="w-4.5 h-4.5" />
            <span>پیشخوان</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('planner')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'planner'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>تقویم و پلنر</span>
            <span className="mr-auto text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-sans">
              {eventsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Calendar className="w-4.5 h-4.5 text-indigo-500" />
            <span>نمای ماهانه تقویم</span>
            <span className="mr-auto text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 px-2.5 py-0.5 rounded-full font-sans font-bold">
              جدید
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5" />
            <span>یادداشت‌های من</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span>وظایف و کانبان</span>
            <span className="mr-auto text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-sans">
              {pendingTasksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('health')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Activity className="w-4.5 h-4.5" />
            <span>تندرستی و عادات</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('assistant')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'assistant'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5 text-teal-500 animate-pulse" />
            <span>دستیار هوشمند</span>
            <span className="mr-auto text-[9px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-bold">AI</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('brain_gym')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'brain_gym'
                ? 'bg-purple-50 text-purple-700 border-r-4 border-purple-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Brain className="w-4.5 h-4.5 text-purple-500" />
            <span>باشگاه مغز</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>پیکربندی سامانه</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'support'
                ? 'bg-teal-50 text-teal-700 border-r-4 border-teal-500'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-4.5 h-4.5" />
              {hasUnreadTickets && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <span>تیکت و پشتیبانی</span>
            {hasUnreadTickets && (
              <span className="mr-auto text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                پاسخ جدید
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* اکشن‌های پایین سایدبار */}
      <div className="space-y-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col">
        <button
          type="button"
          onClick={onOpenZen}
          className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-xs rounded-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-500/10"
        >
          <Moon className="w-4.5 h-4.5 animate-pulse" />
          <span>تمرکز مطلق کایزن (Zen Mode)</span>
        </button>

        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-extrabold text-xs rounded-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4.5 h-4.5 animate-spin" />
          <span>دستیار هوش مصنوعی</span>
        </button>

        <button
          type="button"
          onClick={onOpenLogout}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج کامل</span>
        </button>
      </div>
    </aside>
  );
}