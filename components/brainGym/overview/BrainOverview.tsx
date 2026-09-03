'use client';

import React, { useState } from 'react';
import { BrainProfile, CbtRecord, NeuroHabit, AggregatedBrainMetrics } from '@/lib/supabase/brainGym';
import { Layers, Activity, Zap, Play, Sparkles, CheckCircle2, HelpCircle, Target } from 'lucide-react';
import CognitiveGuideModal, { GuideTopicKey } from '../common/CognitiveGuideModal';

interface BrainOverviewProps {
  brainProfile: BrainProfile;
  aggregatedMetrics: AggregatedBrainMetrics | null;
  cbtRecords: CbtRecord[];
  neuroHabits: NeuroHabit[];
  completedMissionsCount: number;
  onStartSpatialGame: () => void;
}

export default function BrainOverview({
  brainProfile,
  aggregatedMetrics,
  cbtRecords,
  neuroHabits,
  completedMissionsCount,
  onStartSpatialGame
}: BrainOverviewProps) {
  const [selectedGuideTopic, setSelectedGuideTopic] = useState<GuideTopicKey | null>(null);

  // کارت استاندارد نمایش وضعیت مهارت‌های شناختی با اسکلتون لودینگ
  const renderMetricCard = (
    title: string,
    topicKey: GuideTopicKey,
    metricStatus: any,
    icon: React.ReactNode,
    colorClass: { bg: string; text: string; ring: string }
  ) => {
    const isLoading = aggregatedMetrics === null;

    if (isLoading) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800" />
              <div className="space-y-1.5">
                <div className="w-24 h-3.5 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="w-16 h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
          </div>
        </div>
      );
    }

    const isCalibrating = metricStatus?.isCalibrating ?? false;
    const score = metricStatus?.score ?? null;
    const sampleSize = metricStatus?.sampleSize ?? 0;
    const todayAttempts = metricStatus?.todayAttempts ?? 0;
    const todayScore = metricStatus?.todayScore ?? null;

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${colorClass.bg} ${colorClass.text}`}>
              {icon}
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{title}</h4>
              <span className="text-[10px] text-slate-400 font-medium">
                {isCalibrating 
                  ? `کالیبراسیون (${sampleSize} از ۳ آزمون)` 
                  : `بر اساس ${sampleSize} فعالیت اخیر`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedGuideTopic(topicKey)}
            className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="راهنما و مبنای علمی"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {isCalibrating ? (
            <div className="py-2">
              <span className="text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                در حال ارزیابی اولیه...
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {score !== null ? score : '---'}
              </span>
              <span className="text-xs text-slate-400 font-bold">از ۱۰۰</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium">وضعیت امروز:</span>
            {todayAttempts > 0 ? (
              <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{todayAttempts} تمرین (امتیاز: {todayScore})</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">هنوز ثبت نشده</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isLoading = aggregatedMetrics === null;
  const reactionTimeVal = aggregatedMetrics?.avgReactionTimeMs ?? null;
  const accuracyRateVal = aggregatedMetrics?.accuracyRate ?? null;

  return (
    <div className="space-y-6">
      {/* ردیف اول: ۳ مهارت شناختی اصلی */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderMetricCard(
          'قدرت حافظه کاری',
          'memory_score',
          aggregatedMetrics?.spatialMemory,
          <Layers className="w-4 h-4" />,
          { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-300', ring: 'border-purple-500' }
        )}

        {renderMetricCard(
          'انعطاف‌پذیری استروپ',
          'flexibility_score',
          aggregatedMetrics?.stroopFlexibility,
          <Activity className="w-4 h-4" />,
          { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-300', ring: 'border-indigo-500' }
        )}

        {renderMetricCard(
          'سرعت محاسبات ذهنی',
          'math_speed', 
          aggregatedMetrics?.mathSpeed,
          <Zap className="w-4 h-4" />,
          { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-300', ring: 'border-amber-500' }
        )}
      </div>

      {/* ردیف دوم: شاخص‌های تکمیلی زمان واکنش و دقت */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* میانگین زمان واکنش عصبی */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">میانگین زمان واکنش عصبی</h4>
              <p className="text-[10px] text-slate-400">سرعت پردازش پالس‌های عصبی در آزمون‌ها</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-left font-mono">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? '...' : (reactionTimeVal ? reactionTimeVal : '---')}
              </span>
              {!isLoading && reactionTimeVal && <span className="text-xs text-slate-400 font-bold ml-1">ms</span>}
            </div>
            <button
              type="button"
              onClick={() => setSelectedGuideTopic('reaction_time')}
              className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* دقت شناختی */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">میزان دقت شناختی</h4>
              <p className="text-[10px] text-slate-400">درصد پاسخ‌های صحیح در تعاملات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-left font-mono">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {isLoading ? '...' : (accuracyRateVal !== null ? `${accuracyRateVal}٪` : '---')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedGuideTopic('accuracy_score')}
              className="p-1.5 text-slate-400 hover:text-indigo-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* بنر شروع تمرین روزانه */}
      <div className="bg-gradient-to-r from-teal-600 to-indigo-600 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-teal-500/10">
        <div className="space-y-1 text-center sm:text-right">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-teal-200">
            <Sparkles className="w-4 h-4" />
            <span>نرمش روزانه نورون‌ها</span>
          </div>
          <h3 className="text-base font-black">آماده ارزیابی انعطاف ذهنی امروز هستید؟</h3>
          <p className="text-xs text-teal-100 opacity-90 max-w-md">
            تنها ۵ دقیقه تمرین در روز باعث افزایش توانمندی سیناپس‌ها و تثبیت تمرکز می‌شود.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartSpatialGame}
          className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black hover:bg-teal-50 transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-md"
        >
          <Play className="w-4 h-4 fill-slate-900" />
          <span>شروع تمرینات</span>
        </button>
      </div>

      {/* مودال راهنما */}
      <CognitiveGuideModal
        topicKey={selectedGuideTopic}
        onClose={() => setSelectedGuideTopic(null)}
      />
    </div>
  );
}