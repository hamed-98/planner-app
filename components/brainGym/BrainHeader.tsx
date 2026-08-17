'use client';

import React from 'react';
import { Brain, Dna, BarChart2, Zap, Feather, Target, BookOpen } from 'lucide-react';

interface BrainHeaderProps {
  activeTab: 'overview' | 'games' | 'cbt' | 'articles' | 'habits';
  setActiveTab: (tab: 'overview' | 'games' | 'cbt' | 'articles' | 'habits') => void;
  overallIndex: number;
  completedMissionsCount: number;
}

export default function BrainHeader({
  activeTab,
  setActiveTab,
  overallIndex,
  completedMissionsCount
}: BrainHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>سامانه هوشمند نوروساینس و روانشناسی شناختی</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">باشگاه مغز</h1>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
            ارتقای حافظه کاری، افزایش انعطاف‌پذیری استروپ، بازسازی ۸ مرحله‌ای افکار (CBT) و ماموریت‌های روزانه نورون‌سازی.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-start">
          <div>
            <div className="text-[11px] text-purple-200">شاخص قدرت شناختی (Brain Index)</div>
            <div className="text-2xl font-black text-purple-300 flex items-center gap-1.5">
              <span>{overallIndex}</span>
              <span className="text-xs font-normal text-purple-200">/ ۱۰۰</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Dna className="w-6 h-6 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview' ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-purple-100 hover:bg-white/20'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-purple-600" />
          <span>پروفایل و آمارهای شناختی</span>
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'games' ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-purple-100 hover:bg-white/20'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>تمرین‌ها و چالش‌های شناختی</span>
        </button>

        <button
          onClick={() => setActiveTab('cbt')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cbt' ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-purple-100 hover:bg-white/20'
          }`}
        >
          <Feather className="w-4 h-4 text-indigo-500" />
          <span>بازسازی ۸ مرحله‌ای افکار (CBT)</span>
        </button>

        <button
          onClick={() => setActiveTab('habits')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'habits' ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-purple-100 hover:bg-white/20'
          }`}
        >
          <Target className="w-4 h-4 text-pink-500" />
          <span>ماموریت‌های نورون‌سازی ({completedMissionsCount}/۵)</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'articles' ? 'bg-white text-slate-900 shadow-md scale-105' : 'bg-white/10 text-purple-100 hover:bg-white/20'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>دانشنامه نوروساینس</span>
        </button>
      </div>
    </div>
  );
}