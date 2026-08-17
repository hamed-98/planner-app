'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartHandshake } from 'lucide-react';

export const CRISIS_KEYWORDS = [
  'خودکشی', 'میخوام بمیرم', 'می‌خوام بمیرم', 'خودم رو بکشم', 'خودم را بکشم',
  'آسیب بزنم', 'نمیخوام زنده باشم', 'نمی‌خواهم زنده باشم', 'پایان زندگی', 'خاتمه زندگی', 'بی‌ارزشی شدید'
];

interface CrisisAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CrisisAlertModal({ isOpen, onClose }: CrisisAlertModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <HeartHandshake className="w-8 h-8 shrink-0 animate-bounce" />
              <div>
                <h3 className="font-black text-base">پیام حمایتی مهم</h3>
                <p className="text-xs text-rose-500/90">سلامتی و آرامش روان شما بی‌نهایت ارزشمند است.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40">
              اگر در لحظات رنج شدید روانشناختی، احساس بن‌بست یا افکار آسیب به خود هستید، لطفاً با خطوط مشاوره تلفنی رایگان و متخصصین صحبت کنید.
            </p>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold">
                <span>اورژانس اجتماعی (۲۴ ساعته)</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">📞 ۱۲۳</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold">
                <span>مشاوره رایگان بهزیستی</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">📞 ۱۴۸۰</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}