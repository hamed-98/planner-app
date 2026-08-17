'use client';

import React from 'react';
import { Brain, Layers, Clock, CheckCircle2, Play } from 'lucide-react';
import { BrainProfile, CbtRecord, NeuroHabit } from '@/lib/supabase/brainGym';
import { calculateAverage } from '@/lib/utils/brainMath';
import CognitiveBadges from './CognitiveBadges';

interface BrainOverviewProps {
  brainProfile: BrainProfile;
  completedMissionsCount: number;
  cbtRecords: CbtRecord[];
  neuroHabits: NeuroHabit[];
  onStartSpatialGame: () => void;
}

export default function BrainOverview({
  brainProfile,
  cbtRecords,
  neuroHabits,
  completedMissionsCount,
  onStartSpatialGame
}: BrainOverviewProps) {
  const avgAccuracy = calculateAverage(brainProfile.totalAccuracies);
  const avgReactionMs = calculateAverage(brainProfile.reactionTimes);

  return (
    <div className="space-y-6">
      {/* ۴ کارت اصلی شاخص‌ها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              قدرت حافظه کاری
            </span>
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {brainProfile.memoryScore}
            </span>
            <span className="text-[10px] text-slate-400">از ۱۰۰</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${brainProfile.memoryScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              انعطاف‌پذیری استروپ
            </span>
            <Layers className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {brainProfile.flexibilityScore}
            </span>
            <span className="text-[10px] text-slate-400">از ۱۰۰</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${brainProfile.flexibilityScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              میانگین زمان واکنش
            </span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {avgReactionMs}
            </span>
            <span className="text-[10px] text-slate-400">میلی‌ثانیه</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(20, 100 - avgReactionMs / 10)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              میزان دقت شناختی
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {avgAccuracy}٪
            </span>
            <span className="text-[10px] text-slate-400">
              {brainProfile.totalAccuracies.length > 0
                ? `بر پایه ${brainProfile.totalAccuracies.length} آزمون`
                : "بدون آزمون"}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${avgAccuracy}%` }}
            />
          </div>
        </div>
      </div>

      {/* بنر چالش پیشنهادی روز */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-right">
          <span className="text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            🧠 تمرین پیشنهادی امروز
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
            چالش حافظه فضایی (الگوی مستقیم و معکوس)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
            الگوها را بر روی شبکه‌های متغیر به خاطر بسپارید یا در حالت معکوس
            بازسازی کنید.
          </p>
        </div>

        <button
          onClick={onStartSpatialGame}
          className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-500/20 shrink-0 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>شروع چالش حافظه (+۴۰ XP)</span>
        </button>
      </div>

      {/* مدال‌ها و بخش ریست */}
      <CognitiveBadges
        brainProfile={brainProfile}
        cbtRecords={cbtRecords}
        neuroHabits={neuroHabits}
      />
    </div>
  );
}