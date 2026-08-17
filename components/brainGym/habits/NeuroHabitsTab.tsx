'use client';

import React, { useState } from 'react';
import { Flame, Check, Plus } from 'lucide-react';
import { NeuroHabit } from '@/lib/supabase/brainGym';

interface NeuroHabitsTabProps {
  habits: NeuroHabit[];
  onToggleHabit: (id: string) => Promise<void>;
  onAddHabit: (title: string) => Promise<void>;
}

export default function NeuroHabitsTab({ habits, onToggleHabit, onAddHabit }: NeuroHabitsTabProps) {
  const [newTitle, setNewTitle] = useState('');
  const completedCount = habits.filter(h => h.completed).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onAddHabit(newTitle.trim());
    setNewTitle('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 px-2.5 py-0.5 rounded-full font-bold">
            گیمیفیکیشن نورونسازی
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">ماموریت‌های روزانه ایجاد سیناپس جدید</h3>
        </div>

        <div className="flex items-center gap-2 bg-pink-50/80 dark:bg-pink-950/30 px-4 py-2 rounded-2xl border border-pink-200 dark:border-pink-900">
          <Flame className="w-5 h-5 text-pink-500 animate-bounce" />
          <span className="text-xs font-extrabold text-pink-800 dark:text-pink-200">
            ماموریت‌های انجام شده: {completedCount} از {habits.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {habits.map(habit => (
          <div
            key={habit.id}
            onClick={() => onToggleHabit(habit.id)}
            className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
              habit.completed
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-200'
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-pink-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${habit.completed ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>
                {habit.completed && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <span className={`text-xs font-bold ${habit.completed ? 'line-through text-slate-400' : ''}`}>
                {habit.title}
              </span>
            </div>

            <span className="text-[10px] font-extrabold bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 px-2.5 py-1 rounded-full">
              +{habit.xp} XP
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="افزودن عادت مغزی جدید..."
          className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن</span>
        </button>
      </form>
    </div>
  );
}