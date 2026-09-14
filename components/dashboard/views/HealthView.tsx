// components/dashboard/views/HealthView.tsx
'use client';

import React, { useState } from 'react';
import {
  Heart,
  Droplets,
  Weight,
  Smile,
  AlertCircle,
  Trash2,
  GlassWater,
  Minus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HealthMetrics,
  Habit,
  Medicine,
  MoodLog,
} from '@/types/dashboard';
import { getJalaliDate } from '@/lib/utils/date';

interface HealthViewProps {
  health: HealthMetrics;
  habits: Habit[];
  medicines: Medicine[];
  moodLogs: MoodLog[];
  userHeight: number;
  userWeight: number;
  selectedDateISO: string;
  useJalaliCalendar: boolean;
  isSelectedDatePast: boolean;
  isSelectedDateFuture: boolean;
  onSaveHealth: (data: HealthMetrics) => void;
  onSaveHabits: (habits: Habit[]) => void;
  onSaveMedicines: (medicines: Medicine[]) => void;
  onSaveUserHeight: (h: number) => void;
  onSaveUserWeight: (w: number) => void;
  onAddWater: (amount: number) => void;
  onSelectMood: (score: number, label: string) => void;
  toggleHabit: (id: string) => void;
  toggleMedicine: (id: string) => void;
  isHabitCompleted: (h: Habit) => boolean;
  isMedicineCompleted: (m: Medicine) => boolean;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function HealthView({
  health,
  habits,
  medicines,
  moodLogs,
  userHeight,
  userWeight,
  selectedDateISO,
  useJalaliCalendar,
  isSelectedDatePast,
  isSelectedDateFuture,
  onSaveHealth,
  onSaveHabits,
  onSaveMedicines,
  onSaveUserHeight,
  onSaveUserWeight,
  onAddWater,
  onSelectMood,
  toggleHabit,
  toggleMedicine,
  isHabitCompleted,
  isMedicineCompleted,
  showToast,
}: HealthViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'habits_meds' | 'water_sleep' | 'bmi' | 'mood'>('habits_meds');

  // استیت‌های فرم ثبت عادات و مکمل‌ها
  const [newHabitName, setNewHabitName] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedTime, setNewMedTime] = useState('08:00');

  // افزودن دستی عادت
  const addManualHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const item: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName.trim(),
      streak: 0,
      completedToday: false,
    };

    onSaveHabits([...habits, item]);
    setNewHabitName('');
    showToast(`عادت جدید افزوده شد: ${item.name}`, 'success');
  };

  const deleteHabit = (id: string) => {
    onSaveHabits(habits.filter((h) => h.id !== id));
    showToast('عادت مورد نظر حذف گردید.', 'info');
  };

  // افزودن دستی مکمل
  const addManualMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;

    const item: Medicine = {
      id: crypto.randomUUID(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      time: newMedTime,
      completedDates: [],
      completedToday: false,
    };

    onSaveMedicines([...medicines, item]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedTime('08:00');
    showToast(`مکمل جدید ثبت شد: ${item.name}`, 'success');
  };

  const deleteMedicine = (id: string) => {
    onSaveMedicines(medicines.filter((m) => m.id !== id));
    showToast('یادآور مکمل با موفقیت حذف گردید.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* نوار هدر و انتخاب زیرتب‌های سلامت */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
        <div className="space-y-1 text-right flex-shrink-0 lg:max-w-[40%]">
          <span className="text-[10px] bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full font-bold inline-block">
            پیشخوان پایش سلامت سایبان
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
            خانه تندرستی و ردیابی ارگانیک
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
            شاخص‌های زیستی، زنجیره‌های عادات، مکمل‌ها، توده بدنی و خواب خود را مانیتور کنید.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/50 w-full lg:w-auto lg:flex-nowrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('habits_meds')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'habits_meds'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Heart className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>عادات و مکمل‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('water_sleep')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'water_sleep'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4 flex-shrink-0 text-teal-500" />
            <span>پایش آب و خواب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bmi')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'bmi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Weight className="w-4 h-4 flex-shrink-0 text-indigo-500" />
            <span>توده بدنی (BMI)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mood')}
            className={`flex-1 sm:flex-none px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSubTab === 'mood'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smile className="w-4 h-4 flex-shrink-0 text-amber-500" />
            <span>پایش خلق‌وخو</span>
          </button>
        </div>
      </div>

      {/* زیرتب ۱: عادات و مکمل‌ها */}
      {activeSubTab === 'habits_meds' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* بخش عادات */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>زنجیره عادات روزانه (Streak Trackers)</span>
              </h3>
              <span className="text-[10px] bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded font-bold">
                {habits.filter((h) => isHabitCompleted(h)).length} متعهد
              </span>
            </div>

            <form onSubmit={addManualHabit} className="flex gap-2">
              <input
                type="text"
                placeholder="نام عادت جدید (مثلاً ۳۰ دقیقه پیاده‌روی)..."
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-400"
              />
              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
              >
                افزودن
              </button>
            </form>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {habits.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 flex flex-col items-center justify-center text-slate-400 text-[10px]"
                  >
                    <Heart className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    هیچ عادتی ثبت نشده است. شروع به ساخت زنجیره کنید!
                  </motion.div>
                ) : (
                  habits.map((hbt) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={hbt.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 dark:border-slate-800 transition-all"
                    >
                      <div className="space-y-1">
                        <h4
                          className={`font-bold text-xs text-slate-800 dark:text-slate-200 ${
                            isHabitCompleted(hbt) ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {hbt.name}
                        </h4>
                        <span className="text-[10px] text-pink-500 font-bold block">
                          🔥 {hbt.streak} روز متوالی موفق
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSelectedDatePast || isSelectedDateFuture}
                          onClick={() => toggleHabit(hbt.id)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                            isHabitCompleted(hbt)
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          {isHabitCompleted(hbt) ? 'کامل شد ✓' : 'تکمیل امروز'}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteHabit(hbt.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="حذف عادت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* بخش مکمل‌ها و داروها */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
                <span>یادآور مصرف مکمل و داروها</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                {medicines.filter((m) => isMedicineCompleted(m)).length} مصرف‌شده
              </span>
            </div>

            <form
              onSubmit={addManualMedicine}
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className="sm:col-span-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                ثبت یادآور مکمل جدید
              </div>
              <input
                type="text"
                placeholder="نام مکمل (مثلاً ویتامین D3)..."
                value={newMedName}
                onChange={(e) => setNewMedName(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
              />
              <input
                type="text"
                placeholder="دوز (یک کپسول)..."
                value={newMedDosage}
                onChange={(e) => setNewMedDosage(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
              />
              <input
                type="time"
                value={newMedTime}
                onChange={(e) => setNewMedTime(e.target.value)}
                className="text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
              />
              <button
                type="submit"
                className="sm:col-span-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-colors"
              >
                ثبت مکمل جدید
              </button>
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {medicines.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center flex flex-col justify-center items-center py-10 text-slate-400 text-[10px]"
                  >
                    <AlertCircle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    هیچ یادآور مکمل یا دارویی ثبت نشده است.
                  </motion.div>
                ) : (
                  medicines.map((med) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={med.id}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between border border-transparent hover:border-slate-100 dark:border-slate-800 transition-all"
                    >
                      <div className="space-y-1">
                        <h4
                          className={`font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2 ${
                            isMedicineCompleted(med) ? 'text-slate-400 line-through' : ''
                          }`}
                        >
                          <span>{med.name}</span>
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900 font-mono font-bold">
                            {med.time}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">{med.dosage}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSelectedDatePast || isSelectedDateFuture}
                          onClick={() => toggleMedicine(med.id)}
                          className={`px-3 py-1.5 text-xs rounded-xl font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isMedicineCompleted(med)
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 line-through'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isMedicineCompleted(med) ? 'مصرف شد ✓' : 'تأیید مصرف'}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteMedicine(med.id)}
                          className="p-1.5 text-slate-350 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                          title="حذف مکمل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* زیرتب ۲: پایش آب و خواب */}
      {activeSubTab === 'water_sleep' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* پایش مصرف آب */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="text-teal-500 text-lg">💧</span>
                <span>پایش نوشیدن آب روزانه</span>
              </h4>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg">
                هدف: ۸ لیوان در روز
              </span>
            </div>

            <div className="flex items-center justify-between bg-teal-50/20 dark:bg-teal-950/20 p-5 rounded-2xl border border-teal-100/50 dark:border-teal-900/50">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">مصرف شده تا این لحظه:</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
                  {health.waterToday} از ۸
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">لیوان آب</span>
              </div>

              {/* دایره پیشرفت آب */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="font-extrabold text-xs text-teal-600 dark:text-teal-400">
                  {Math.min(100, Math.round((health.waterToday / 8) * 100))}%
                </span>
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e2e8f0" strokeWidth="4" className="dark:stroke-slate-800" />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="4"
                    strokeDasharray="176"
                    strokeDashoffset={Math.max(0, 176 - (176 * Math.min(health.waterToday, 8)) / 8)}
                    className="transition-all duration-500"
                  />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={isSelectedDatePast || isSelectedDateFuture}
                onClick={() => onAddWater(1)}
                className="py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <GlassWater className="w-4 h-4 flex-shrink-0" />
                <span>نوشیدن ۱ لیوان آب</span>
              </button>

              <button
                type="button"
                disabled={isSelectedDatePast || isSelectedDateFuture || (health.waterToday || 0) <= 0}
                onClick={() => onAddWater(-1)}
                className="py-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-0.5"
              >
                <GlassWater className="w-4 h-4 flex-shrink-0" />
                <Minus className="w-3 h-3 flex-shrink-0 text-rose-500" />
                <span>کاهش (۱- لیوان)</span>
              </button>
            </div>
          </div>

          {/* پایش خواب عمیق */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="text-indigo-500 text-lg">🌙</span>
                <span>سنجش خواب و ریکاوری غدد مغزی</span>
              </h4>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                توصیه: ۷.۵ ساعت
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">ساعات استراحت شب گذشته:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                  {health.sleepHours} ساعت
                </span>
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

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase">کیفیت عمومی خواب:</label>
                  <select
                    disabled={isSelectedDatePast || isSelectedDateFuture}
                    value={health.sleepQuality}
                    onChange={(e) => onSaveHealth({ ...health, sleepQuality: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs cursor-pointer disabled:opacity-40"
                  >
                    <option value="excellent">🏆 بسیار عالی و عمیق</option>
                    <option value="good">🟢 خوب و با نشاط</option>
                    <option value="fair">🟡 خستگی نسبی و خواب سطحی</option>
                    <option value="poor">🔴 نامنظم و خواب‌پریشی</option>
                  </select>
                </div>

                <div className="flex flex-col justify-center items-center bg-indigo-50/40 dark:bg-indigo-950/20 p-3 rounded-2xl text-center border border-indigo-100/50 dark:border-indigo-900/50">
                  <span className="text-[9px] text-slate-400 block font-bold mb-1">بازسازی بیولوژیک سلولی:</span>
                  <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
                    {health.sleepQuality === 'excellent'
                      ? '۱۰۰٪ (ایده‌آل)'
                      : health.sleepQuality === 'good'
                      ? '۸۵٪ (بسیار خوب)'
                      : health.sleepQuality === 'fair'
                      ? '۶۰٪ (متوسط)'
                      : '۳۵٪ (نیازمند استراحت)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* زیرتب ۳: شاخص توده بدنی (BMI) */}
      {activeSubTab === 'bmi' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <span>ماشین حساب و آنالیز شاخص توده بدنی (BMI)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                با ثبت منظم وزن و قد، نسبت ترکیب بدنی خود را تحلیل و بهینه‌سازی کنید.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    قد شما (سانتی‌متر):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="100"
                      max="250"
                      value={userHeight}
                      onChange={(e) => onSaveUserHeight(Number(e.target.value))}
                      className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full font-mono focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-xs text-slate-400">cm</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    وزن امروز (کیلوگرم):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="30"
                      max="280"
                      step="0.1"
                      value={userWeight}
                      onChange={(e) => onSaveUserWeight(Number(e.target.value))}
                      className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 w-full font-mono focus:outline-none focus:border-rose-400"
                    />
                    <span className="text-xs text-slate-400">kg</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSaveUserWeight(Number((userWeight - 0.5).toFixed(1)))}
                  className="text-xs font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  -۰.۵ کیلوگرم
                </button>
                <button
                  type="button"
                  onClick={() => onSaveUserWeight(Number((userWeight + 0.5).toFixed(1)))}
                  className="text-xs font-bold px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  +۰.۵ کیلوگرم
                </button>
              </div>
            </div>

            {/* در زیرتب bmi فایل HealthView.tsx */}
            {userHeight > 0 && userWeight > 0 ? (
              (() => {
                const heightInMeters = userHeight / 100;
                const bmi = Number((userWeight / (heightInMeters * heightInMeters)).toFixed(1)) || 0;
                let bmiState = 'نرمال';
                let bmiColor = 'text-emerald-600 dark:text-emerald-400';
                let bmiBg = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
                let scaleOffset = '45%';

                if (bmi < 18.5) {
                  bmiState = 'کمبود وزن بدنی';
                  bmiColor = 'text-amber-600 dark:text-amber-400';
                  bmiBg = 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
                  scaleOffset = '22%';
                } else if (bmi >= 18.5 && bmi < 25) {
                  bmiState = 'تناسب وزن ایده‌آل و نرمال';
                  bmiColor = 'text-emerald-600 dark:text-emerald-400';
                  bmiBg = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
                  scaleOffset = '45%';
                } else if (bmi >= 25 && bmi < 30) {
                  bmiState = 'اضافه‌وزن نسبی';
                  bmiColor = 'text-orange-600 dark:text-orange-400';
                  bmiBg = 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
                  scaleOffset = '68%';
                } else {
                  bmiState = 'چاقی و تجمع بیش‌ازحد چربی';
                  bmiColor = 'text-rose-600 dark:text-rose-400';
                  bmiBg = 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800';
                  scaleOffset = '88%';
                }

                return (
                  <div className={`p-6 rounded-2xl border ${bmiBg} text-right space-y-4`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">شاخص بیولوژیکی (BMI):</span>
                      <span className={`text-2xl font-black font-mono leading-none ${bmiColor}`}>{bmi}</span>
                    </div>

                    <div className="text-xs font-bold text-slate-750 dark:text-slate-200 leading-relaxed">
                      وضعیت شما: <span className={bmiColor}>{bmiState}</span>
                    </div>

                    <div className="bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full relative overflow-visible mt-6">
                      <div
                        className="absolute top-[-4px] w-4.5 h-4.5 rounded-full bg-slate-900 dark:bg-white border-2 border-white dark:border-slate-900 shadow transition-all duration-300"
                        style={{ right: scaleOffset }}
                      />
                      <div className="absolute top-4 text-[8px] text-slate-400 right-[22%] translate-x-[50%] font-bold">
                        لاغر (&lt;۱۸.۵)
                      </div>
                      <div className="absolute top-4 text-[8px] text-slate-400 right-[45%] translate-x-[50%] font-bold">
                        ایده‌آل (۱۸.۵-۲۵)
                      </div>
                      <div className="absolute top-4 text-[8px] text-slate-400 right-[68%] translate-x-[50%] font-bold">
                        اضافه (۲۵-۳۰)
                      </div>
                      <div className="absolute top-4 text-[8px] text-slate-400 right-[88%] translate-x-[50%] font-bold">
                        چاق (&gt;۳۰)
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="p-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Weight className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300">قد و وزن هنوز ثبت نشده است</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                  لطفاً مقادیر قد و وزن خود را از کادرهای کناری وارد کنید تا نمودار شاخص توده بدنی برای شما فعال گردد.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* زیرتب ۴: پایش خلق‌وخو و سوابق نوسان احساسی */}
      {activeSubTab === 'mood' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ثبت خلق‌وخوی روز */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="text-lg">🎭</span>
                <span>پایش نوسانات احساسی روزانه</span>
              </h4>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                سطح انگیزه و حال روحی امروزتان را لمس کنید تا در نمودار ثبت گردد:
              </p>

              <div className="flex justify-around items-center py-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-2xl">
                {(
                  [
                    { score: 5, label: 'بمب انگیزه', emoji: '🚀' },
                    { score: 4, label: 'شاداب', emoji: '😊' },
                    { score: 3, label: 'معمولی', emoji: '😐' },
                    { score: 2, label: 'خسته/بی‌ذوق', emoji: '😞' },
                    { score: 1, label: 'عصبی/بحرانی', emoji: '😠' },
                  ] as const
                ).map((item) => (
                  <button
                    type="button"
                    key={item.score}
                    disabled={isSelectedDatePast || isSelectedDateFuture}
                    onClick={() => onSelectMood(item.score, item.label)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      health.moodScore === item.score
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 scale-105 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <span className="text-2xl mb-1">{item.emoji}</span>
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* تاریخچه نوسانات احساسی */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>📉</span>
                <span>سوابق نوسان احساسی</span>
              </h4>
            </div>

            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {
              moodLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  هنوز وضعیت روحی برای شما ثبت نشده است.
                </div>
              ) :
              (
              moodLogs
                .slice()
                .reverse()
                .map((log, i) => {
                  const dateText = !log.date
                    ? ''
                    : useJalaliCalendar
                    ? getJalaliDate(log.date)
                    : log.date;

                  let moodEmoji = '😐';
                  let moodStyle = 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';

                  if (log.mood === 5) {
                    moodEmoji = '🚀 بمب انگیزه';
                    moodStyle = 'text-pink-600 bg-pink-50 dark:bg-pink-950/50 font-bold';
                  } else if (log.mood === 4) {
                    moodEmoji = '😊 خندان و پر انرژی';
                    moodStyle = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 font-bold';
                  } else if (log.mood === 3) {
                    moodEmoji = '😐 معمولی و آرام';
                    moodStyle = 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950';
                  } else if (log.mood === 2) {
                    moodEmoji = '😞 کمی خسته';
                    moodStyle = 'text-amber-600 bg-amber-50 dark:bg-amber-950/50';
                  } else if (log.mood === 1) {
                    moodEmoji = '😠 دغدغه‌مند/بحرانی';
                    moodStyle = 'text-rose-600 bg-rose-50 dark:bg-rose-950/50';
                  }

                  return (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs p-2.5 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-slate-500 dark:text-slate-400 font-bold">{dateText}</span>
                      <span className={`text-[10px] px-2.5 py-1 rounded-lg ${moodStyle}`}>{moodEmoji}</span>
                    </div>
                  );
                })
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}