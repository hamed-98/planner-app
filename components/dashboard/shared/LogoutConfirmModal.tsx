// components/dashboard/shared/LogoutConfirmModal.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
            dir="rtl"
          >
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-4">تأیید خروج</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-loose">
              آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-5 py-2.5 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow shadow-rose-500/20 transition-all cursor-pointer"
              >
                خروج
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}