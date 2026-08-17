'use client';

import React from 'react';
import { Award, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { BrainProfile, CbtRecord, NeuroHabit } from '@/lib/supabase/brainGym';
import { calculateAverage } from '@/lib/utils/brainMath';

interface CognitiveBadgesProps {
  brainProfile: BrainProfile;
  cbtRecords: CbtRecord[];
  neuroHabits: NeuroHabit[];
}

interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  currentValue: number;
  levels: { target: number; label: string; tier: 'برنز' | 'نقره' | 'طلا' | 'الماس' }[];
}

export default function CognitiveBadges({
  brainProfile,
  cbtRecords,
  neuroHabits
}: CognitiveBadgesProps) {
  const completedHabitsCount = neuroHabits.filter(h => h.completed).length;
  const avgReaction = calculateAverage(brainProfile.reactionTimes);

  const BADGES: BadgeDef[] = [
    {
      id: 'games_streak',
      title: 'استمرار نورونی',
      desc: 'انجام منظم تمرین‌های شناختی',
      icon: '🔥',
      currentValue: brainProfile.gamesPlayed,
      levels: [
        { target: 5, label: '۵ تمرین', tier: 'برنز' },
        { target: 20, label: '۲۰ تمرین', tier: 'نقره' },
        { target: 50, label: '۵۰ تمرین', tier: 'الماس' }
      ]
    },
    {
      id: 'cbt_master',
      title: 'کیمیاگر افکار (CBT)',
      desc: 'تکمیل چرخه‌های بازسازی شناختی',
      icon: '🔮',
      currentValue: cbtRecords.length,
      levels: [
        { target: 3, label: '۳ چرخه', tier: 'برنز' },
        { target: 10, label: '۱۰ چرخه', tier: 'نقره' },
        { target: 25, label: '۲۵ چرخه', tier: 'طلا' }
      ]
    },
    {
      id: 'habit_synapse',
      title: 'معمار سیناپس',
      desc: 'تکمیل ماموریت‌های نورون‌سازی',
      icon: '🌱',
      currentValue: completedHabitsCount,
      levels: [
        { target: 5, label: '۵ ماموریت', tier: 'برنز' },
        { target: 20, label: '۲۰ ماموریت', tier: 'نقره' },
        { target: 50, label: '۵۰ ماموریت', tier: 'الماس' }
      ]
    },
    {
      id: 'memory_pro',
      title: 'حافظه برتر',
      desc: 'ارتقای قدرت حافظه کاری',
      icon: '🧠',
      currentValue: brainProfile.memoryScore,
      levels: [
        { target: 40, label: 'امتیاز ۴۰', tier: 'برنز' },
        { target: 75, label: 'امتیاز ۷۵', tier: 'نقره' },
        { target: 95, label: 'امتیاز ۹۵', tier: 'طلا' }
      ]
    },
    {
      id: 'reaction_speed',
      title: 'واکنش رعدآسا',
      desc: 'کاهش زمان پردازش به میلی‌ثانیه',
      icon: '⚡',
      currentValue: avgReaction > 0 ? Math.max(0, 700 - avgReaction) : 0,
      levels: [
        { target: 200, label: '< ۵۰۰ms', tier: 'برنز' },
        { target: 350, label: '< ۳۵۰ms', tier: 'نقره' },
        { target: 450, label: '< ۲۵۰ms', tier: 'الماس' }
      ]
    },
    {
      id: 'flexibility_stroop',
      title: 'انعطاف فولادین',
      desc: 'تسلط بر تست تداخل استروپ',
      icon: '🎯',
      currentValue: brainProfile.flexibilityScore,
      levels: [
        { target: 50, label: 'امتیاز ۵۰', tier: 'برنز' },
        { target: 80, label: 'امتیاز ۸۰', tier: 'نقره' },
        { target: 100, label: 'امتیاز ۱۰۰', tier: 'الماس' }
      ]
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>تالار افتخارات و مدال‌های شناختی</span>
        </h3>
        <span className="text-xs text-slate-400 font-bold">پیشرفت پویا بر اساس عملکرد</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGES.map(badge => {
          // محاسبه بالاترین سطح باز شده
          const unlockedLevels = badge.levels.filter(l => badge.currentValue >= l.target);
          const currentLevelIdx = unlockedLevels.length;
          const nextLevel = badge.levels[currentLevelIdx] || badge.levels[badge.levels.length - 1];
          const isMaxed = currentLevelIdx === badge.levels.length;

          // درصد پیشرفت برای سطح بعدی
          const prevTarget = currentLevelIdx > 0 ? badge.levels[currentLevelIdx - 1].target : 0;
          const progressPercent = isMaxed
            ? 100
            : Math.min(100, Math.max(0, Math.round(((badge.currentValue - prevTarget) / (nextLevel.target - prevTarget)) * 100)));

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                currentLevelIdx > 0
                  ? 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-50/30 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl p-2 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                    {badge.icon}
                  </div>
                  <div>
                    <div className="font-black text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{badge.title}</span>
                      {currentLevelIdx > 0 && (
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md font-bold">
                          {unlockedLevels[unlockedLevels.length - 1].tier}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{badge.desc}</div>
                  </div>
                </div>

                {isMaxed ? (
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : currentLevelIdx === 0 ? (
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                  <span>
                    {isMaxed ? 'کامل شد 🏆' : `هدف بعد: ${nextLevel.label} (${nextLevel.tier})`}
                  </span>
                  <span>{isMaxed ? '۱۰۰٪' : `${progressPercent}٪`}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isMaxed ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-purple-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}