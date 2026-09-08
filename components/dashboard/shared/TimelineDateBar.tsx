// components/dashboard/shared/TimelineDateBar.tsx
'use client';

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { CalendarEvent, Task } from '@/types/dashboard';

interface TimelineDateBarProps {
  selectedDateISO: string;
  todayISO: string;
  useJalaliCalendar: boolean;
  tasks: Task[];
  events: CalendarEvent[];
  isSelectedDatePast: boolean;
  isSelectedDateFuture: boolean;
  onSelectDate: (iso: string) => void;
  onModifyDays: (days: number) => void;
}

export default function TimelineDateBar({
  selectedDateISO,
  todayISO,
  useJalaliCalendar,
  tasks,
  events,
  isSelectedDatePast,
  isSelectedDateFuture,
  onSelectDate,
  onModifyDays,
}: TimelineDateBarProps) {
  return (
    <>
      <div
        className="mb-6 flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-2 sm:px-4 sm:py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
        dir="rtl"
      >
        <button
          onClick={() => onModifyDays(-1)}
          className="p-1 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950 transition cursor-pointer"
          title="روز قبل"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="flex-1 flex justify-center items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar px-1">
          {Array.from({ length: 7 }).map((_, i) => {
            if (!selectedDateISO) return null;
            const d = new Date(selectedDateISO + 'T12:00:00Z');
            d.setUTCDate(d.getUTCDate() - 3 + i);
            const dateIsoStr = d.toISOString().split('T')[0];
            const isSelected = dateIsoStr === selectedDateISO;
            const isToday = dateIsoStr === todayISO;

            const hasTask = tasks.some((t) => t.dueDate === dateIsoStr);
            const hasEvent = events.some((e) => e.date === dateIsoStr);

            const dayName = useJalaliCalendar
              ? new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(d)
              : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d);

            const dayNumStr = useJalaliCalendar
              ? new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(d)
              : new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(d);

            const monthName = useJalaliCalendar
              ? new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(d)
              : new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d);

            return (
              <div
                key={dateIsoStr}
                onClick={() => onSelectDate(dateIsoStr)}
                className={`flex flex-col items-center justify-center min-w-[38px] sm:min-w-[46px] py-1.5 sm:py-2 cursor-pointer rounded-xl transition-all ${
                  isSelected
                    ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                    : isToday
                    ? 'bg-teal-50 text-teal-700 border border-teal-100'
                    : 'hover:bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border border-transparent hover:border-slate-100 dark:border-slate-800'
                }`}
              >
                <span className={`text-[8px] sm:text-[9px] mb-0.5 font-medium ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                  {dayName}
                </span>
                <span className="text-sm sm:text-base font-black leading-none">{dayNumStr}</span>
                <span className={`text-[8px] sm:text-[9px] mt-0.5 font-medium ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                  {monthName}
                </span>
                <div className="flex gap-0.5 mt-1 h-1">
                  {hasTask ? (
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-teal-200' : 'bg-rose-400'}`} />
                  ) : (
                    <div className="w-1 h-1" />
                  )}
                  {hasEvent ? (
                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white dark:bg-slate-900' : 'bg-indigo-400'}`} />
                  ) : (
                    <div className="w-1 h-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onModifyDays(1)}
          className="p-1 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950 transition cursor-pointer"
          title="روز بعد"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {isSelectedDatePast && (
        <div
          className="mb-6 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-850/30 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800/60 flex items-center gap-3 text-xs font-semibold shadow-sm"
          dir="rtl"
        >
          <span className="text-base text-amber-500">⚠️</span>
          <div>
            شما در حال مشاهده روز گذشته هستید. برای حفظ پایش بیولوژیک، امکان ثبت مجدد داده‌های سلامت برای گذشته وجود ندارد.
          </div>
        </div>
      )}

      {isSelectedDateFuture && (
        <div
          className="mb-6 p-4 rounded-2xl bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20 flex items-center gap-3 text-xs font-semibold shadow-sm"
          dir="rtl"
        >
          <span className="text-base">⚠️</span>
          <div>این روز در آینده است؛ امکان ثبت مقادیر سلامت قبل از فرارسیدن آن وجود ندارد.</div>
        </div>
      )}
    </>
  );
}