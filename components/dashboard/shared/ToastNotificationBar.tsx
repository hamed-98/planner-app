// components/dashboard/shared/ToastNotificationBar.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastNotification } from '@/types/dashboard';

interface ToastNotificationBarProps {
  toast: ToastNotification | null;
  onClose: () => void;
}

export default function ToastNotificationBar({ toast, onClose }: ToastNotificationBarProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border text-xs font-bold font-sans text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border-slate-150/80"
          dir="rtl"
        >
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toast.type === 'success' ? 'bg-teal-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
            }`}
          />
          <span>{toast.message}</span>
          <button onClick={onClose} className="mr-2 text-slate-450 hover:text-slate-800 dark:text-slate-200 text-[10px] cursor-pointer" type="button">
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}