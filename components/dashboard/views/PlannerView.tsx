// components/dashboard/views/PlannerView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { CalendarEvent } from '@/types/dashboard';
import { getJalaliDate } from '@/lib/utils/date';

interface PlannerViewProps {
  events: CalendarEvent[];
  selectedDateISO: string;
  todayISO: string;
  useJalaliCalendar: boolean;
  onToggleCalendarType: () => void;
  onSaveEvents: (events: CalendarEvent[]) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function PlannerView({
  events,
  selectedDateISO,
  todayISO,
  useJalaliCalendar,
  onToggleCalendarType,
  onSaveEvents,
  showToast,
}: PlannerViewProps) {
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(selectedDateISO || todayISO || '');
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [newEventCat, setNewEventCat] = useState<'work' | 'personal' | 'health' | 'learning'>('work');

  // همگام‌سازی تاریخ فرم با تاریخ انتخاب‌شده
  useEffect(() => {
    if (selectedDateISO) {
      setNewEventDate(selectedDateISO);
    }
  }, [selectedDateISO]);

  const addManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const item: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEventTitle.trim(),
      desc: 'ثبت دستی رویداد در تقویم',
      date: newEventDate || selectedDateISO || todayISO,
      time: newEventTime,
      category: newEventCat,
      recurrence: 'none',
    };

    onSaveEvents([...events, item]);
    setNewEventTitle('');
    showToast(`رویداد "${item.title}" با موفقیت در تقویم ثبت شد.`, 'success');
  };

  const deleteEvent = (id: string) => {
    onSaveEvents(events.filter((e) => e.id !== id));
    showToast('رویداد از تقویم حذف گردید.', 'info');
  };

  // محاسبه ایمن ۵ روز پیرامون تاریخ انتخابی (با گارد در برابر رشته خالی)
  const fiveDayDates = Array.from({ length: 5 })
    .map((_, i) => {
      if (!selectedDateISO) return '';
      const d = new Date(`${selectedDateISO}T12:00:00Z`);
      if (isNaN(d.getTime())) return '';
      d.setUTCDate(d.getUTCDate() - 2 + i);
      return d.toISOString().split('T')[0];
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* هدر ماژول تقویم */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">تقویم زمان‌بندی</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            قرارهای کاری و رویدادهای روزانه خود را در اسلات‌های منظم تقویم مدیریت کنید.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleCalendarType}
          className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        >
          نمایش تقویم: {useJalaliCalendar ? 'خورشیدی (جلالی)' : 'میلادی (Gregorian)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* پنل فرم ثبت رویداد جدید */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-extrabold text-sm mb-4 text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            درج رویداد جدید به تقویم
          </h3>

          <form onSubmit={addManualEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                عنوان قرار ملاقات / رویداد
              </label>
              <input
                type="text"
                required
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="مثال: جلسه کاری، دندان‌پزشکی"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تاریخ</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  format="YYYY/MM/DD"
                  value={newEventDate ? new Date(`${newEventDate}T12:00:00`) : ''}
                  onChange={(date: any) => {
                    if (date) {
                      const jsDate = date.toDate();
                      const yy = jsDate.getFullYear();
                      const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
                      const dd = String(jsDate.getDate()).padStart(2, '0');
                      setNewEventDate(`${yy}-${mm}-${dd}`);
                    }
                  }}
                  containerClassName="w-full"
                  inputClass="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-center focus:outline-none focus:border-teal-500"
                  placeholder="انتخاب تاریخ"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">ساعت شروع</label>
                <input
                  type="time"
                  required
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">دسته‌بندی</label>
              <select
                value={newEventCat}
                onChange={(e) => setNewEventCat(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="work">کارهای شغلی / اداری</option>
                <option value="personal">مسائل شخصی</option>
                <option value="health">سلامت و ورزش</option>
                <option value="learning">مطالعه و یادگیری</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-teal-600/20"
            >
              ثبت در تقویم سایبان
            </button>
          </form>
        </div>

        {/* ستون نمایش ۵ روزه رویدادها */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              نمای ۵ روزه پیرامون تاریخ انتخابی
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-500" /> کاری
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> شخصی
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> سلامت
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {fiveDayDates.map((dateStr) => {
              const isToday = dateStr === todayISO;
              const dailyEvents = events.filter((e) => e.date === dateStr);
              const formattedDate = useJalaliCalendar ? getJalaliDate(dateStr) : dateStr;

              return (
                <div
                  key={dateStr}
                  className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border transition-colors ${
                    isToday
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-600'
                      : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="shrink-0">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{formattedDate}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{isToday && '(امروز)'}</span>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {dailyEvents.map((ev) => {
                      const badgeStyle =
                        ev.category === 'health'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                          : ev.category === 'work'
                          ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';

                      return (
                        <div
                          key={ev.id}
                          className={`px-2.5 py-1 text-xs rounded-xl border flex items-center gap-2 ${badgeStyle}`}
                        >
                          <span className="font-mono text-[9px] font-bold">{ev.time}</span>
                          <span className="font-medium font-sans">{ev.title}</span>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer text-[10px]"
                            title="حذف رویداد"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    {dailyEvents.length === 0 && (
                      <span className="text-xs text-slate-400 italic">بدون قرار کاری یا ورزشی</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}