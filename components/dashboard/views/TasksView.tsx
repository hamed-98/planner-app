// components/dashboard/views/TasksView.tsx
'use client';

import React, { useState } from 'react';
import { CheckSquare, Activity, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '@/types/dashboard';
import { getJalaliDate } from '@/lib/utils/date';

interface TasksViewProps {
  tasks: Task[];
  selectedDateISO: string;
  useJalaliCalendar: boolean;
  isSelectedDatePast: boolean;
  isSelectedDateFuture: boolean;
  onSaveTasks: (tasks: Task[]) => void;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function TasksView({
  tasks,
  selectedDateISO,
  useJalaliCalendar,
  isSelectedDatePast,
  isSelectedDateFuture,
  onSaveTasks,
  earnXp,
  showToast,
}: TasksViewProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');

  const addManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    if (isSelectedDatePast || isSelectedDateFuture) {
      showToast('برنامه‌ریزی و ثبت کارها تنها برای روز جاری ممکن است.', 'error');
      return;
    }

    const item: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      desc: 'ایجاد دستی در پیشخوان کایزن',
      status: 'todo',
      priority: newTaskPriority,
      dueDate: selectedDateISO,
    };

    onSaveTasks([...tasks, item]);
    setNewTaskTitle('');
    showToast(`کار جدید "${item.title}" ثبت گردید.`, 'success');
  };

  const updateTaskStatus = (id: string, nextStatus: 'todo' | 'doing' | 'done') => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const updated = tasks.map((t) => (t.id === id ? { ...t, status: nextStatus } : t));
    onSaveTasks(updated);

    if (nextStatus === 'done') {
      earnXp(20, `تکمیل کار "${target.title}"`);
    } else if (target.status === 'done') {
      earnXp(-20, `لغو تکمیل کار "${target.title}"`);
    }
  };

  const deleteTask = (id: string) => {
    onSaveTasks(tasks.filter((t) => t.id !== id));
    showToast('کار مورد نظر حذف گردید.', 'info');
  };

  const dateLabel = (dateStr: string) => (useJalaliCalendar ? getJalaliDate(dateStr) : dateStr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            بورد کارهای من (آسان کایزن و کانبان)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            وظایف خود را سازماندهی کرده و با تغییر وضعیت آن‌ها امتیاز تجربه دریافت کنید.
          </p>
        </div>

        {/* فرم ثبت وظیفه */}
        <form
          onSubmit={addManualTask}
          className="flex gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
        >
          <input
            type="text"
            required
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="افزودن کار تازه..."
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-teal-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          />

          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as any)}
            className="px-2 py-1 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="HIGH">اولویت بالا</option>
            <option value="MEDIUM">متوسط</option>
            <option value="LOW">پایین</option>
          </select>

          <button
            type="submit"
            className="bg-teal-600 text-white text-xs font-bold px-4.5 py-1.5 rounded-xl hover:bg-teal-700 cursor-pointer transition-colors"
          >
            درج وظیفه
          </button>
        </form>
      </div>

      {/* ستون‌های ۳ گانه کانبان */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ۱. کارهای مانده (To Do) */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>کارهای مانده</span>
            </span>
            <span className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {tasks.filter((t) => t.status === 'todo' && t.dueDate === selectedDateISO).length}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {tasks.filter((t) => t.status === 'todo' && t.dueDate === selectedDateISO).length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center justify-center text-slate-400">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <CheckSquare className="w-4 h-4 text-slate-300" />
                </div>
                <span className="text-[10px]">کارهایتان را اینجا وارد کنید</span>
              </motion.div>
            )}

            {tasks
              .filter((t) => t.status === 'todo' && t.dueDate === selectedDateISO)
              .map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={task.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-normal">{task.title}</h4>
                    <button onClick={() => deleteTask(task.id)} className="text-slate-450 hover:text-rose-500 transition-colors cursor-pointer">
                      ✕
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">{dateLabel(task.dueDate)}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        task.priority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.priority === 'HIGH' ? 'مهم' : 'عادی'}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'doing')}
                      className="text-[9px] font-black text-teal-600 hover:underline bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded cursor-pointer"
                    >
                      حرکت به اقدام →
                    </button>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* ۲. در دست اقدام (Doing) */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>در دست اقدام</span>
            </span>
            <span className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {tasks.filter((t) => t.status === 'doing' && t.dueDate === selectedDateISO).length}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {tasks.filter((t) => t.status === 'doing' && t.dueDate === selectedDateISO).length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center justify-center text-slate-400">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <Activity className="w-4 h-4 text-slate-300" />
                </div>
                <span className="text-[10px]">خالی</span>
              </motion.div>
            )}

            {tasks
              .filter((t) => t.status === 'doing' && t.dueDate === selectedDateISO)
              .map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={task.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2"
                >
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-normal">{task.title}</h4>
                  <p className="text-[10px] text-slate-400">{dateLabel(task.dueDate)}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'todo')}
                      className="text-[9px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 cursor-pointer"
                    >
                      ← برگشت
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'done')}
                      className="text-[9px] font-black text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded cursor-pointer"
                    >
                      کامل شد ✓
                    </button>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        {/* ۳. کامل‌شده (Done) */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>کامل شده</span>
            </span>
            <span className="text-[10px] bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
              {tasks.filter((t) => t.status === 'done' && t.dueDate === selectedDateISO).length}
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {tasks.filter((t) => t.status === 'done' && t.dueDate === selectedDateISO).length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center justify-center text-slate-400">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <Check className="w-4 h-4 text-emerald-300" />
                </div>
                <span className="text-[10px]">در انتظار تکمیل</span>
              </motion.div>
            )}

            {tasks
              .filter((t) => t.status === 'done' && t.dueDate === selectedDateISO)
              .map((task) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={task.id}
                  className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm opacity-70 hover:opacity-100 transition-opacity space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 line-through leading-normal decoration-emerald-500">
                      {task.title}
                    </h4>
                    <button onClick={() => deleteTask(task.id)} className="text-slate-450 hover:text-rose-500 transition-colors cursor-pointer">
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold inline-block">
                      تکمیل شده
                    </span>
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'doing')}
                      className="text-[9px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      ← برگشت به در حال انجام
                    </button>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}