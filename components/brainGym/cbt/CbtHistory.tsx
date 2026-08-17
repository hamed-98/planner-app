'use client';

import React from 'react';
import { BookOpen, Feather, Trash2 } from 'lucide-react';
import { CbtRecord } from '@/lib/supabase/brainGym';
import { COGNITIVE_DISTORTIONS } from './CbtWizard';

interface CbtHistoryProps {
  records: CbtRecord[];
  onDeleteRecord: (id: string) => Promise<void>;
}

export default function CbtHistory({ records, onDeleteRecord }: CbtHistoryProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-indigo-500" />
        <span>تاریخچه افکار بازسازی شده</span>
      </h4>

      {records.length === 0 ? (
        <div className="text-center py-8 text-slate-400 space-y-2">
          <Feather className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 opacity-60" />
          <p className="text-xs">هنوز هیچ چرخه CBT ثبت نشده است.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(rec => (
            <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-bold text-rose-500">فکر منفی: {rec.automaticThought}</span>
                <div className="flex items-center gap-2">
                  <span>{rec.date}</span>
                  <button
                    onClick={() => onDeleteRecord(rec.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="حذف رکورد"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                فکر جایگزین منطقی: {rec.reframedThought}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span>کاهش باور منفی: {rec.initialBelief}٪ ➔ {rec.newBelief}٪</span>
                <span>خطا: {COGNITIVE_DISTORTIONS.find(d => d.id === rec.distortion)?.name || rec.distortion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}