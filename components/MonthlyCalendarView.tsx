'use client';

import React, { useState } from 'react';
import { CalendarEvent, Task } from './Dashboard';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Trash2, 
  Check, 
  Clock, 
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MonthlyCalendarViewProps {
  events: CalendarEvent[];
  tasks: Task[];
  saveEventsToLocal: (events: CalendarEvent[]) => void;
  saveTasksToLocal: (tasks: Task[]) => void;
  useJalaliCalendar: boolean;
  todayISO: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const JALALI_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

const GREGORIAN_MONTH_NAMES = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"
];

interface CalendarDateCell {
  date: Date;
  isoStr: string; // YYYY-MM-DD
  year: number;
  month: number;
  day: number;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  isCurrentMonth: boolean;
}

function toEnglishDigits(str: string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str
    .replace(/[۰-۹]/g, w => String(farsiDigits.indexOf(w)))
    .replace(/[٠-٩]/g, w => String(arabicDigits.indexOf(w)));
}

function toPersianDigits(str: string) {
  return str.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
}

function getLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getJalaliComponents(date: Date) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    let year = 1;
    let month = 1;
    let day = 1;
    for (const part of parts) {
      if (part.type === 'year') year = parseInt(toEnglishDigits(part.value), 10);
      else if (part.type === 'month') month = parseInt(toEnglishDigits(part.value), 10);
      else if (part.type === 'day') day = parseInt(toEnglishDigits(part.value), 10);
    }
    return { year, month, day };
  } catch (e) {
    return {
      year: date.getFullYear() - 621,
      month: 1,
      day: 1
    };
  }
}

export default function MonthlyCalendarView({
  events,
  tasks,
  saveEventsToLocal,
  saveTasksToLocal,
  useJalaliCalendar,
  todayISO,
  showToast
}: MonthlyCalendarViewProps) {
  // Get today's initial view year/month
  const initialToday = new Date();
  
  const getInitialYearMonth = () => {
    if (useJalaliCalendar) {
      const jalali = getJalaliComponents(initialToday);
      return { year: jalali.year, month: jalali.month };
    } else {
      return { year: initialToday.getFullYear(), month: initialToday.getMonth() + 1 };
    }
  };

  const [currentView, setCurrentView] = useState(getInitialYearMonth());
  const [selectedDayCell, setSelectedDayCell] = useState<CalendarDateCell | null>(null);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventTime, setNewEventTime] = useState("09:00");
  const [newEventCat, setNewEventCat] = useState<'work' | 'personal' | 'health' | 'learning'>('work');

  // Generate Jalali month list
  const getJalaliMonthDays = (targetYear: number, targetMonth: number): CalendarDateCell[] => {
    // Jalali Month starts around the 21st of a Gregorian month.
    // Farvardin (1) starts in March (Month index 2) of targetYear + 621.
    // Dey (10) starts in December (Month index 11) of targetYear + 621.
    // Bahman (11) starts in January (Month index 0) of targetYear + 622.
    // Esfand (12) starts in February (Month index 1) of targetYear + 622.
    let gy: number;
    let gm: number; // 0-indexed Gregorian month
    
    if (targetMonth <= 10) {
      gy = targetYear + 621;
      gm = targetMonth + 1; // e.g. targetMonth=1 => gm=2 (March)
    } else {
      gy = targetYear + 622;
      gm = targetMonth - 11; // targetMonth=11 => gm=0 (January)
    }
    
    // We start from the 15th of the starting Gregorian month and scan from i = -10 to 45.
    // This covers 55 days, spanning from the 5th of Gregorian month gm to the 10th of Gregorian month gm + 2,
    // which is guaranteed to fully cover the corresponding Jalali month (which falls around gm 20th to gm+1 20th).
    const scanStart = new Date(gy, gm, 15);
    const days: CalendarDateCell[] = [];
    
    for (let i = -10; i <= 45; i++) {
      const d = new Date(gy, gm, 15 + i);
      const parts = getJalaliComponents(d);
      if (parts.year === targetYear && parts.month === targetMonth) {
        days.push({
          date: d,
          isoStr: getLocalISOString(d),
          year: parts.year,
          month: parts.month,
          day: parts.day,
          dayOfWeek: d.getDay(),
          isCurrentMonth: true
        });
      }
    }
    return days.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Build the entire grid for the current view
  const buildCalendarGrid = (): CalendarDateCell[] => {
    const { year, month } = currentView;
    
    if (useJalaliCalendar) {
      const currentDays = getJalaliMonthDays(year, month);
      if (currentDays.length === 0) return [];
      
      // Jalali Week starting Saturday: 
      // Sunday is 0 -> Saturday (6) is 0 index, Sunday is 1, etc.
      // Saturday is index 0
      const firstDayW = (currentDays[0].dayOfWeek + 1) % 7;
      
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevDays = getJalaliMonthDays(prevYear, prevMonth);
      const prefixDays = firstDayW > 0 ? prevDays.slice(-firstDayW).map(d => ({ ...d, isCurrentMonth: false })) : [];
      
      const totalSlots = Math.ceil((currentDays.length + firstDayW) / 7) * 7;
      const suffixCount = totalSlots - (currentDays.length + firstDayW);
      
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const nextDays = getJalaliMonthDays(nextYear, nextMonth);
      const suffixDays = nextDays.slice(0, suffixCount).map(d => ({ ...d, isCurrentMonth: false }));
      
      return [...prefixDays, ...currentDays, ...suffixDays];
    } else {
      // Gregorian
      const currentMonthDaysCount = new Date(year, month, 0).getDate();
      const currentDays = Array.from({ length: currentMonthDaysCount }).map((_, idx) => {
        const day = idx + 1;
        const d = new Date(year, month - 1, day);
        return {
          date: d,
          isoStr: getLocalISOString(d),
          year,
          month,
          day,
          dayOfWeek: d.getDay(),
          isCurrentMonth: true
        };
      });

      // Gregorian Week starting Sunday:
      const firstDayW = currentDays[0].dayOfWeek;
      
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevMonthDaysCount = new Date(prevYear, prevMonth, 0).getDate();
      
      const prefixDays = Array.from({ length: firstDayW }).map((_, idx) => {
        const day = prevMonthDaysCount - firstDayW + idx + 1;
        const d = new Date(prevYear, prevMonth - 1, day);
        return {
          date: d,
          isoStr: getLocalISOString(d),
          year: prevYear,
          month: prevMonth,
          day,
          dayOfWeek: d.getDay(),
          isCurrentMonth: false
        };
      });

      const totalSlots = Math.ceil((currentDays.length + firstDayW) / 7) * 7;
      const suffixCount = totalSlots - (currentDays.length + firstDayW);
      
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const suffixDays = Array.from({ length: suffixCount }).map((_, idx) => {
        const day = idx + 1;
        const d = new Date(nextYear, nextMonth - 1, day);
        return {
          date: d,
          isoStr: getLocalISOString(d),
          year: nextYear,
          month: nextMonth,
          day,
          dayOfWeek: d.getDay(),
          isCurrentMonth: false
        };
      });

      return [...prefixDays, ...currentDays, ...suffixDays];
    }
  };

  const gridDays = buildCalendarGrid();

  // Weekday Headers
  const getWeekdayHeaders = () => {
    if (useJalaliCalendar) {
      return ['شنبه', '۱شنبه', '۲شنبه', '۳شنبه', '۴شنبه', '۵شنبه', 'جمعه'];
    } else {
      return ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
    }
  };

  const handlePrevMonth = () => {
    setCurrentView(prev => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      return { year: y, month: m };
    });
  };

  const handleNextMonth = () => {
    setCurrentView(prev => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 12) {
        m = 1;
        y += 1;
      }
      return { year: y, month: m };
    });
  };

  // Quick Action: Today
  const handleGoToToday = () => {
    const today = new Date();
    if (useJalaliCalendar) {
      const jalali = getJalaliComponents(today);
      setCurrentView({ year: jalali.year, month: jalali.month });
    } else {
      setCurrentView({ year: today.getFullYear(), month: today.getMonth() + 1 });
    }
  };

  // Add event for selected date
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDayCell || !newEventTitle.trim()) {
      showToast("لطفا عنوان رویداد را وارد کنید.", "error");
      return;
    }

    const fresh: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEventTitle,
      desc: newEventDesc,
      date: selectedDayCell.isoStr,
      time: newEventTime,
      category: newEventCat,
      recurrence: 'none'
    };

    saveEventsToLocal([fresh, ...events]);
    showToast(`رویداد "${newEventTitle}" با موفقیت ثبت شد.`, "success");

    // Clear state
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventTime("09:00");
  };

  // Delete event
  const handleDeleteEvent = (id: string, title: string) => {
    saveEventsToLocal(events.filter(ev => ev.id !== id));
    showToast(`رویداد "${title}" حذف شد.`, "info");
  };

  // Toggle task status
  const handleToggleTask = (task: Task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const updated = tasks.map(t => t.id === task.id ? { ...t, status: nextStatus as any } : t);
    saveTasksToLocal(updated);
    showToast(`وضعیت کار "${task.title}" تغییر کرد.`, "success");
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 tracking-wider uppercase bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-full">
            نمای ماهانه کامل و جامع کورتکس
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            بورد بزرگ تقویم سایبان
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            رویدادها و کارهای خود را بر روی یک بورد بزرگ یک ماهه ردیابی و مدیریت کنید.
          </p>
        </div>

        {/* Month Switching Controls */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2 rounded-2xl shadow-sm self-start sm:self-center">
          <button 
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300 flex items-center gap-1 text-xs font-bold"
            title="ماه قبل"
          >
            <ChevronRight className="w-4 h-4" />
            <span>ماه قبل</span>
          </button>
          
          <div className="h-5 w-px bg-slate-150 dark:bg-slate-850" />

          <button 
            onClick={handleGoToToday}
            className="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-black text-teal-600 dark:text-teal-400 cursor-pointer"
          >
            امروز
          </button>

          <div className="h-5 w-px bg-slate-150 dark:bg-slate-850" />

          <button 
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300 flex items-center gap-1 text-xs font-bold"
            title="ماه بعد"
          >
            <span>ماه بعد</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Big Month Display and Year */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-450 block font-bold">ماه جاری در حال نمایش</span>
          <h3 className="text-2xl font-black text-teal-400 mt-1">
            {useJalaliCalendar 
              ? `${JALALI_MONTH_NAMES[currentView.month - 1]} ${toPersianDigits(String(currentView.year))}` 
              : `${GREGORIAN_MONTH_NAMES[currentView.month - 1]} ${currentView.year}`
            }
          </h3>
        </div>

        <div className="flex gap-4 text-xs">
          <div className="bg-slate-850 px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <span className="text-slate-400 block font-medium">نوع تقویم فعال</span>
            <span className="font-extrabold text-teal-400 mt-1 block">
              {useJalaliCalendar ? 'خورشیدی (جلالی)' : 'میلادی (Gregorian)'}
            </span>
          </div>

          <div className="bg-slate-850 px-4 py-2 rounded-2xl border border-slate-800 text-center">
            <span className="text-slate-400 block font-medium">کل رویدادهای ثبت‌شده</span>
            <span className="font-extrabold text-cyan-400 mt-1 block font-mono">
              {toPersianDigits(String(events.length))}
            </span>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Weekdays row */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-150 dark:border-slate-800 text-center font-black text-xs text-slate-550 py-3.5">
          {getWeekdayHeaders().map(header => (
            <div key={header} className="truncate px-1 text-slate-650 dark:text-slate-350">
              {header}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-850/60 bg-slate-50/20 dark:bg-slate-900/40 text-right">
          {gridDays.map((cell, index) => {
            const isToday = cell.isoStr === todayISO;
            const dayEvents = events.filter(e => e.date === cell.isoStr);
            const dayTasks = tasks.filter(t => t.dueDate === cell.isoStr);
            const totalItems = dayEvents.length + dayTasks.length;

            return (
              <div 
                key={`${cell.isoStr}-${index}`}
                onClick={() => setSelectedDayCell(cell)}
                className={`min-h-[110px] md:min-h-[130px] p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer hover:bg-teal-50/10 dark:hover:bg-slate-850/30 ${
                  cell.isCurrentMonth 
                    ? 'bg-white dark:bg-slate-900' 
                    : 'bg-slate-50/40 dark:bg-slate-950/20 text-slate-400 opacity-45'
                }`}
              >
                {/* Day Header */}
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-medium font-mono px-1.5 py-0.5 rounded ${
                    isToday ? 'bg-cyan-500 text-white font-black rounded-lg animate-pulse' : 'text-slate-400'
                  }`}>
                    {isToday ? 'امروز' : ''}
                  </span>
                  
                  <span className={`text-sm font-extrabold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                    isToday 
                      ? 'bg-teal-600 text-white font-black' 
                      : cell.isCurrentMonth 
                        ? 'text-slate-800 dark:text-slate-100' 
                        : 'text-slate-400'
                  }`}>
                    {useJalaliCalendar ? toPersianDigits(String(cell.day)) : cell.day}
                  </span>
                </div>

                {/* Day Content (Pills list) */}
                <div className="mt-2 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                  {/* Show events pills */}
                  {dayEvents.slice(0, 2).map(ev => {
                    const catColors = 
                      ev.category === 'health' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' :
                      ev.category === 'work' ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' :
                      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20';

                    return (
                      <div 
                        key={ev.id} 
                        className={`text-[10px] py-0.5 px-2 rounded-md border truncate font-medium flex items-center gap-1 ${catColors}`}
                        title={ev.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                        <span className="font-mono text-[8px] opacity-75 shrink-0">{ev.time}</span>
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}

                  {/* Show tasks pills */}
                  {dayTasks.slice(0, 2).map(t => (
                    <div 
                      key={t.id} 
                      className={`text-[10px] py-0.5 px-2 rounded-md border truncate font-medium flex items-center gap-1 bg-amber-500/10 border-amber-500/20 ${
                        t.status === 'done' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-amber-700 dark:text-amber-400'
                      }`}
                      title={`کار: ${t.title}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.status === 'done' ? 'bg-slate-400' : 'bg-amber-500'}`} />
                      <span className="truncate">کار: {t.title}</span>
                    </div>
                  ))}

                  {/* More indicator */}
                  {totalItems > 4 && (
                    <div className="text-[9px] text-teal-600 dark:text-teal-400 font-bold pr-1 text-center bg-teal-50/50 dark:bg-teal-950/20 py-0.5 rounded-md mt-0.5 animate-pulse">
                      {toPersianDigits(String(totalItems - 4))}+ مورد دیگر
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 justify-center pb-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
          کارهای شغلی / اداری
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          مسائل شخصی / یادگیری
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          سلامت و ورزش
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          کارهای کورتکس (ToDo)
        </span>
      </div>

      {/* Details / Register Modal */}
      <AnimatePresence>
        {selectedDayCell && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {/* Left Side: Day Events and Tasks List */}
              <div className="p-6 md:w-3/5 border-b md:border-b-0 md:border-l border-slate-150 dark:border-slate-850 flex flex-col justify-between min-h-[400px]">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 block">برنامه‌های روز</span>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        {useJalaliCalendar 
                          ? `${JALALI_MONTH_NAMES[selectedDayCell.month - 1]} ${toPersianDigits(String(selectedDayCell.day))} ${toPersianDigits(String(selectedDayCell.year))}`
                          : `${selectedDayCell.day} ${GREGORIAN_MONTH_NAMES[selectedDayCell.month - 1]} ${selectedDayCell.year}`
                        }
                      </h4>
                    </div>

                    <button 
                      onClick={() => setSelectedDayCell(null)}
                      className="p-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer md:hidden"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* List of events/tasks on that day */}
                  <div className="space-y-3 overflow-y-auto max-h-[280px] pr-1">
                    {/* Events */}
                    {events.filter(e => e.date === selectedDayCell.isoStr).length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">رویدادهای تقویم</h5>
                        {events.filter(e => e.date === selectedDayCell.isoStr).map(ev => (
                          <div 
                            key={ev.id} 
                            className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-3 h-3 rounded-full shrink-0 ${
                                ev.category === 'health' ? 'bg-emerald-500' : ev.category === 'work' ? 'bg-teal-500' : 'bg-indigo-500'
                              }`} />
                              <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{ev.title}</span>
                                {ev.desc && <span className="text-[10px] text-slate-450 block">{ev.desc}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 px-2 py-1 rounded-lg">
                                {ev.time}
                              </span>
                              <button 
                                onClick={() => handleDeleteEvent(ev.id, ev.title)}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="حذف رویداد"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Tasks */}
                    {tasks.filter(t => t.dueDate === selectedDayCell.isoStr).length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">کارهای تسک بورد (ToDo)</h5>
                        {tasks.filter(t => t.dueDate === selectedDayCell.isoStr).map(t => (
                          <div 
                            key={t.id} 
                            className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleTask(t)}
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                  t.status === 'done' 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-500'
                                }`}
                              >
                                {t.status === 'done' && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <div>
                                <span className={`text-xs font-bold block ${t.status === 'done' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {t.title}
                                </span>
                                {t.desc && <span className="text-[10px] text-slate-450 block">{t.desc}</span>}
                              </div>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              t.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' : t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30' : 'bg-slate-50 text-slate-600'
                            }`}>
                              اولویت {t.priority === 'HIGH' ? 'فوری' : t.priority === 'MEDIUM' ? 'متوسط' : 'کم'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {events.filter(e => e.date === selectedDayCell.isoStr).length === 0 && 
                     tasks.filter(t => t.dueDate === selectedDayCell.isoStr).length === 0 && (
                      <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-750" />
                        <span className="text-xs italic">هیچ برنامه یا کاری برای این روز ست نشده است.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-450 mt-4 border-t border-slate-100 dark:border-slate-850 pt-3">
                  تسک‌ها را در تب مدیریت تسک‌ها و رویدادهای ثابت را همین‌جا ایجاد کنید.
                </div>
              </div>

              {/* Right Side: Quick Add Event Form */}
              <div className="p-6 md:w-2/5 bg-slate-50 dark:bg-slate-950/50 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-teal-600" />
                      رویداد یا قرار جدید
                    </h4>
                    
                    <button 
                      onClick={() => setSelectedDayCell(null)}
                      className="p-1.5 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer hidden md:block"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddEvent} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">عنوان رویداد</label>
                      <input 
                        type="text" 
                        required
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        placeholder="جلسه کاری، باشگاه ورزشی و..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/35"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">توضیحات تکمیلی</label>
                      <textarea 
                        value={newEventDesc}
                        onChange={(e) => setNewEventDesc(e.target.value)}
                        placeholder="جزییات، مکان یا اهداف رویداد"
                        rows={2}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/35 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">ساعت برگزاری</label>
                        <div className="relative">
                          <input 
                            type="time" 
                            required
                            value={newEventTime}
                            onChange={(e) => setNewEventTime(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/35"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">دسته‌بندی</label>
                        <select 
                          value={newEventCat} 
                          onChange={(e) => setNewEventCat(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/35"
                        >
                          <option value="work">کاری / اداری</option>
                          <option value="personal">مسائل شخصی</option>
                          <option value="health">سلامت و ورزش</option>
                          <option value="learning">مطالعه و پژوهش</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-teal-600/15"
                    >
                      ثبت رویداد جدید
                    </button>
                  </form>
                </div>

                <button 
                  onClick={() => setSelectedDayCell(null)}
                  className="w-full py-2.5 mt-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
