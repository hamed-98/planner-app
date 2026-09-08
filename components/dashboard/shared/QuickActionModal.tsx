// components/dashboard/shared/QuickActionModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Task, CalendarEvent, Note } from '@/types/dashboard';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateISO: string;
  todayISO: string;
  onAddTask: (task: Task) => void;
  onAddEvent: (event: CalendarEvent) => void;
  onAddNote: (note: Note) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function QuickActionModal({
  isOpen,
  onClose,
  selectedDateISO,
  todayISO,
  onAddTask,
  onAddEvent,
  onAddNote,
  showToast,
}: QuickActionModalProps) {
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddResult, setQuickAddResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim() || isProcessing) return;

    setIsProcessing(true);
    setQuickAddResult('در حال پردازش هوشمند دستور...');

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'command',
          message: quickAddText.trim(),
          userData: {
            targetDate: selectedDateISO,
            clientToday: todayISO || new Date().toISOString().split('T')[0],
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setQuickAddResult(data.text || '⚠️ خطا در پردازش.');
        showToast(data.text || 'خطا در پردازش درخواست.', 'error');
        return;
      }

      if (data.actionData?.action && data.actionData?.payload) {
        const { action, payload } = data.actionData;
        const targetDate = payload.targetDate || payload.date || payload.dueDate || selectedDateISO;

        if (action === 'ADD_TASK') {
          const newTask: Task = {
            id: crypto.randomUUID(),
            title: payload.title || 'کار جدید',
            desc: payload.content || '',
            priority: payload.priority || 'MEDIUM',
            status: 'todo',
            dueDate: targetDate,
          };
          onAddTask(newTask);
          setQuickAddResult(`✅ وظیفه "${newTask.title}" برای تاریخ ${targetDate} ثبت گردید.`);
          showToast('کار جدید ثبت شد!', 'success');
        } else if (action === 'ADD_EVENT') {
          const newEv: CalendarEvent = {
            id: crypto.randomUUID(),
            title: payload.title || 'رویداد جدید',
            desc: payload.content || 'ثبت دستیار سریع',
            date: targetDate,
            time: payload.time || '12:00',
            category: payload.category || 'work',
            recurrence: 'none',
          };
          onAddEvent(newEv);
          setQuickAddResult(`📅 رویداد "${newEv.title}" برای ساعت ${newEv.time} ثبت شد.`);
          showToast('رویداد جدید ثبت شد!', 'success');
        } else if (action === 'ADD_NOTE') {
          const newNote: Note = {
            id: crypto.randomUUID(),
            title: payload.title || 'یادداشت جدید',
            content: payload.content || '',
            folder: 'برنامه‌ها',
            tags: ['هوشمند'],
            isPinned: false,
            updatedAt: targetDate,
          };
          onAddNote(newNote);
          setQuickAddResult(`📝 یادداشت "${newNote.title}" ثبت گردید.`);
          showToast('یادداشت ثبت شد!', 'success');
        } else {
          setQuickAddResult(data.text || 'دستور دریافت شد.');
        }
      }
    } catch {
      setQuickAddResult('خطایی در ارتباط با سرور هوش مصنوعی رخ داد.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-150 shadow-2xl space-y-4 relative"
            dir="rtl"
          >
            <button
              onClick={() => {
                onClose();
                setQuickAddResult(null);
                setQuickAddText('');
              }}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 dark:text-slate-200 text-lg cursor-pointer font-bold"
            >
              ✕
            </button>

            <h3 className="text-base mx-2 font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span>درج فوری کار / رویداد (NLP AI)</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              جمله مورد نظر خود را به زبان فارسی تایپ کنید تا دستیار هوشمند، اسلات تقویم، وظیفه یا یادداشت شما را ثبت کند.
            </p>

            <form onSubmit={handleQuickAdd} className="space-y-3">
              <input
                type="text"
                required
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                placeholder="مثال: فردا ساعت ۱۸ جلسه کاری اضافه کن"
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700 shadow shadow-teal-500/10 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'در حال تحلیل...' : 'پردازش دستور'}
                </button>
              </div>
            </form>

            {quickAddResult && (
              <div className="bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-150/50 text-xs font-semibold text-teal-900 dark:text-teal-300 leading-loose">
                {quickAddResult}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}