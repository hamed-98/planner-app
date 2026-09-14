// components/dashboard/views/OverviewView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Moon,
  Droplet,
  Smile,
  Heart,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import {
  CalendarEvent,
  Task,
  HealthMetrics,
  Habit,
  Medicine,
  DashboardTab,
} from '@/types/dashboard';
import { AggregatedBrainMetrics, BrainProfile } from '@/lib/api/brainGym';
import { getJalaliDate, getGreetingMessage } from '@/lib/utils/date';

interface OverviewViewProps {
  userName: string;
  selectedDateISO: string;
  todayISO: string;
  useJalaliCalendar: boolean;
  health: HealthMetrics;
  tasks: Task[];
  events: CalendarEvent[];
  habits: Habit[];
  medicines: Medicine[];
  brainMetrics: AggregatedBrainMetrics | null;
  brainProfile: BrainProfile;
  userWeight: number;
  userHeight: number;
  isHealthDataLoaded: boolean;
  isSelectedDatePast: boolean;
  isSelectedDateFuture: boolean;
  isHabitCompleted: (h: Habit) => boolean;
  isMedicineCompleted: (m: Medicine) => boolean;
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenZen: () => void;
  onAddWater: (amount: number) => void;
  onSaveHealth: (data: HealthMetrics) => void;
  onSelectMood: (score: number, label: string) => void;
  onSaveUserWeight: (w: number) => void;
  onSaveTasks: (tasks: Task[]) => void;
  earnXp: (amount: number, reason: string) => void;
}

export default function OverviewView({
  userName,
  selectedDateISO,
  todayISO,
  useJalaliCalendar,
  health,
  tasks,
  events,
  habits,
  medicines,
  brainMetrics,
  brainProfile,
  userWeight,
  userHeight,
  isHealthDataLoaded,
  isSelectedDatePast,
  isSelectedDateFuture,
  isHabitCompleted,
  isMedicineCompleted,
  onNavigateTab,
  onOpenZen,
  onAddWater,
  onSaveHealth,
  onSelectMood,
  onSaveUserWeight,
  onSaveTasks,
  earnXp,
}: OverviewViewProps) {
  const [greeting, setGreeting] = useState('');
  const [aiTip, setAiTip] = useState('در حال بررسی داده‌های تندرستی و روزانه شما...');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  useEffect(() => {
    setGreeting(getGreetingMessage());
  }, []);

  // دریافت و کش تحلیل هوشمند
  const fetchSmartAiAnalysis = async (forceRefresh: boolean = false) => {
    if (!selectedDateISO || selectedDateISO > todayISO) {
      setAiTip('روز انتخاب شده در آینده است! امکان تحلیل آینده وجود ندارد.');
      return;
    }

    const cacheKey = `sayeban_daily_ai_tip_${selectedDateISO}`;
    if (!forceRefresh && typeof window !== 'undefined') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.date === selectedDateISO && parsed.tip) {
            setAiTip(parsed.tip);
            return;
          }
        } catch {}
      }
    }

    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analyze',
          userData: {
            userName,
            waterToday: health.waterToday,
            sleepHours: health.sleepHours,
            sleepQuality: health.sleepQuality,
            moodScore: health.moodScore,
            weight: userWeight,
            eventsToday: events.filter((e) => e.date === selectedDateISO).length,
            completedTasksToday: tasks.filter((t) => t.dueDate === selectedDateISO && t.status === 'done').length,
            pendingTasksToday: tasks.filter((t) => t.dueDate === selectedDateISO && t.status !== 'done').length,
            totalMedicinesToday: medicines.length,
            completedMedicinesToday: medicines.filter((m) => isMedicineCompleted(m)).length,
            totalHabitsToday: habits.length,
            completedHabitsToday: habits.filter((h) => isHabitCompleted(h)).length,
            brainMetrics,
            brainProfile,
            clientToday: todayISO,
            targetDate: selectedDateISO,
          },
        }),
      });

      const data = await res.json();
      if (data.text) {
        setAiTip(data.text);
        if (typeof window !== 'undefined') {
          localStorage.setItem(cacheKey, JSON.stringify({ date: selectedDateISO, tip: data.text }));
        }
      }
    } catch {
      setAiTip('مصرف آب و ساعات خواب خود را منظم نگه دارید تا بازدهی شناختی شما پایدار بماند.');
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // ارسال ایمن درخواست صرفاً پس از اتمام بارگذاری دیتابیس
  useEffect(() => {
    if (!userName || !selectedDateISO || !isHealthDataLoaded) return;

    if (selectedDateISO > todayISO) {
      setAiTip('روز انتخاب شده در آینده است! امکان تحلیل آینده وجود ندارد.');
      return;
    }

    const timer = setTimeout(() => {
      fetchSmartAiAnalysis(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [userName, selectedDateISO, todayISO, isHealthDataLoaded]);

  // پیشگیری از پرتاب RangeError با اعمال گارد تاریخ معتبر
  const dateText = !selectedDateISO
    ? ''
    : useJalaliCalendar
    ? getJalaliDate(selectedDateISO)
    : new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(`${selectedDateISO}T12:00:00Z`));

  const completedTodayCount = selectedDateISO
    ? tasks.filter((t) => t.status === 'done' && t.dueDate === selectedDateISO).length
    : 0;

  return (
    <div className="space-y-6">
      {/* بنر خوش‌آمدگویی هوشمند */}
      <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-10 top-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl" />
        <div className="relative">
          <span className="text-xs bg-teal-500/20 text-teal-300 font-bold px-3 py-1 rounded-full uppercase">
            پیشخوان سایبان
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-3 mb-2">
            {userName} عزیز، {greeting}
          </h1>
          <p className="text-xs text-slate-350">
            {dateText} | شما در این روز {completedTodayCount} کار را تکمیل کردید.
          </p>
        </div>
      </div>

      {/* کارت تحلیل روزانه دستیار هوش مصنوعی */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>توصیه و تحلیل امروز دستیار سایبان</span>
              </h3>
              <button
                title={selectedDateISO > todayISO ? 'امکان تحلیل برای آینده وجود ندارد' : 'به‌روزرسانی تحلیل'}
                disabled={selectedDateISO > todayISO || isAnalyzingAi || !isHealthDataLoaded}
                onClick={() => fetchSmartAiAnalysis(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 dark:bg-slate-950 cursor-pointer transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin text-teal-500' : ''}`} />
              </button>
            </div>
            {isAnalyzingAi ? (
              <p className="text-xs text-slate-400 font-mono italic animate-pulse">
                در حال پردازش وضعیت زیستی، شناختی و کارهای شما...
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{aiTip}</p>
            )}
          </div>
        </div>
      </div>

      {/* میانبر حالت تمرکز مطلق (Zen Mode) */}
      <div
        className="bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-rose-500/10 p-5 rounded-3xl border border-rose-100 dark:border-rose-950 flex flex-col md:flex-row items-center justify-between gap-4 text-right"
        dir="rtl"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-2xl shadow-md animate-pulse">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200">
              حالت تمرکز مطلق و تکنیک پومودورو کایزن (Zen Mode)
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
              با موسیقی‌های آرامش‌بخش اتمسفریک، غرق در کار عمیق شوید.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenZen}
          className="whitespace-nowrap bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white text-xs font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md shadow-rose-500/15"
        >
          راه‌اندازی زنگ کایزن و تمرکز مطلق 🧘
        </button>
      </div>

      {/* ویجت‌های ۴گانه رصد وضعیت */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ۱. مصرف آب */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-bold">مصرف آب امروز</span>
            <Droplet className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-center py-2">
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {health.waterToday} <span className="text-xs font-normal text-slate-400">لیوان</span>
            </h4>
            <p className="text-[10px] text-teal-600 font-bold mt-1">هدف روزانه: ۸ لیوان آب</p>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={isSelectedDatePast || isSelectedDateFuture}
              onClick={() => onAddWater(1)}
              className="flex-1 py-2 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
            >
              <span>+ ۱ لیوان</span>
              <span>🥛</span>
            </button>
            <button
              type="button"
              disabled={isSelectedDatePast || isSelectedDateFuture || (health.waterToday || 0) <= 0}
              onClick={() => onAddWater(-1)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="کاهش یک لیوان"
            >
              - ۱
            </button>
          </div>
        </div>

        {/* ۲. کیفیت و ساعت خواب */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 font-bold">میزان و کیفیت خواب</span>
            <Moon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-center py-1">
            <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {health.sleepHours} <span className="text-xs font-normal text-slate-400">ساعت</span>
            </h4>
            <p className="text-[10px] text-indigo-500 font-bold mt-0.5">
              کیفیت:{' '}
              {health.sleepQuality === 'excellent'
                ? 'بسیار عالی'
                : health.sleepQuality === 'good'
                ? 'خوب و رضایت‌بخش'
                : health.sleepQuality === 'fair'
                ? 'متوسط'
                : 'آشفته'}
            </p>
          </div>
          <input
            type="range"
            min="0"
            max="14"
            step="0.5"
            disabled={isSelectedDatePast || isSelectedDateFuture}
            value={health.sleepHours}
            onChange={(e) => onSaveHealth({ ...health, sleepHours: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-40"
          />
          <select
            disabled={isSelectedDatePast || isSelectedDateFuture}
            value={health.sleepQuality}
            onChange={(e) => onSaveHealth({ ...health, sleepQuality: e.target.value as any })}
            className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1 cursor-pointer"
          >
            <option value="excellent">🏆 بسیار عالی و عمیق</option>
            <option value="good">🟢 خوب و با نشاط</option>
            <option value="fair">🟡 متوسط و سطحی</option>
            <option value="poor">🔴 آشفته و خواب‌پریشی</option>
          </select>
        </div>

        {/* ۳. پایش خلق‌وخو */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-bold">خلق‌وخوی امروز</span>
            <Smile className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex justify-center gap-1.5 py-3">
            {[
              { score: 1, label: 'عصبی/بحرانی', emoji: '😡' },
              { score: 2, label: 'خسته/بی‌ذوق', emoji: '😔' },
              { score: 3, label: 'معمولی', emoji: '😐' },
              { score: 4, label: 'شاداب', emoji: '😊' },
              { score: 5, label: 'بمب انگیزه', emoji: '🤩' },
            ].map((item) => (
              <button
                key={item.score}
                type="button"
                disabled={isSelectedDatePast || isSelectedDateFuture}
                onClick={() => onSelectMood(item.score, item.label)}
                className={`text-lg p-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-30 ${
                  health.moodScore === item.score
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 scale-110 border border-emerald-300 dark:border-emerald-700'
                    : 'opacity-50 hover:opacity-100'
                }`}
                title={item.label}
              >
                {item.emoji}
              </button>
            ))}
          </div>
          <p className="text-center text-[10px] font-bold text-slate-400 mt-1">
            امتیاز ثبت‌شده: {health.moodScore} از ۵
          </p>
        </div>

        {/* ۴. وزن و BMI */}
        {/* ویجت شاخص BMI در OverviewView.tsx */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs text-slate-400 font-bold">شاخص BMI</span>
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
          {userWeight > 0 && userHeight > 0 ? (
            <>
              <div className="text-center py-2">
                <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {userWeight} <span className="text-xs font-normal text-slate-400">کیلوگرم</span>
                </h4>
                {(() => {
                  const hM = userHeight / 100;
                  const bmi = Number((userWeight / (hM * hM)).toFixed(1)) || 0;
                  let state = 'نرمال';
                  if (bmi < 18.5) state = 'کمبود وزن';
                  else if (bmi >= 25 && bmi < 30) state = 'اضافه‌وزن';
                  else if (bmi >= 30) state = 'چاق';
                  return <p className="text-[10px] text-rose-600 font-bold mt-1">شاخص: {bmi} ({state})</p>;
                })()}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onSaveUserWeight(Number((userWeight - 0.5).toFixed(1)))}
                  className="text-xs font-bold p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                >
                  -0.5
                </button>
                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '65%' }} />
                </div>
                <button
                  onClick={() => onSaveUserWeight(Number((userWeight + 0.5).toFixed(1)))}
                  className="text-xs font-bold p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                >
                  +0.5
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <h4 className="text-xs font-bold text-slate-400">ثبت نشده</h4>
              <p className="text-[10px] text-teal-600 font-medium mt-1">قد و وزن را در تب سلامت ثبت کنید</p>
            </div>
          )}
        </div>
      </div>

      {/* خلاصه رویدادها و وظایف امروز */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span>برنامه و قرار ملاقات‌های امروز</span>
            </h3>
            <button
              onClick={() => onNavigateTab('planner')}
              className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
            >
              دیدن تقویم کامل
            </button>
          </div>

          <div className="space-y-3">
            {events
              .filter((e) => e.date === selectedDateISO)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between border-r-4 border-teal-500"
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">{ev.time}</span>
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 mt-0.5">{ev.title}</h5>
                  </div>
                  <span className="text-[10px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 border border-slate-100 dark:border-slate-700">
                    {ev.category}
                  </span>
                </div>
              ))}
            {events.filter((e) => e.date === selectedDateISO).length === 0 && (
              <div className="text-center py-8 text-slate-400 italic text-xs">
                رویدادی برای این تاریخ مقرر نشده است.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <span>کارهای اولویت‌دار امروز</span>
            </h3>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
            >
              مشاهده بورد کانبان
            </button>
          </div>

          <div className="space-y-3">
            {tasks
              .filter((t) => t.status !== 'done' && t.dueDate === selectedDateISO)
              .slice(0, 3)
              .map((task) => (
                <div key={task.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      onChange={() => {
                        const updated = tasks.map((t) => (t.id === task.id ? { ...t, status: 'done' as const } : t));
                        onSaveTasks(updated);
                        earnXp(20, `تکمیل کار "${task.title}"`);
                      }}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer border-slate-300 dark:border-slate-600"
                    />
                    <span className="font-semibold text-xs text-slate-700 dark:text-slate-300">{task.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {task.priority === 'HIGH' ? 'مهم' : 'عادی'}
                  </span>
                </div>
              ))}
            {tasks.filter((t) => t.status !== 'done' && t.dueDate === selectedDateISO).length === 0 && (
              <div className="text-center py-8 text-slate-400 italic text-xs">
                کارهای این روز با موفقیت تکمیل شده است. 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}