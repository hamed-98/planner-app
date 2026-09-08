// components/dashboard/views/SettingsView.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Monitor, Download } from 'lucide-react';
import { useTheme } from 'next-themes';

interface SettingsViewProps {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  useJalaliCalendar: boolean;
  onToggleCalendarType: () => void;
  onExportBackup: () => void;
}

export default function SettingsView({
  fontSize,
  setFontSize,
  useJalaliCalendar,
  onToggleCalendarType,
  onExportBackup,
}: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
        تنظیمات و پیکربندی سامانه
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        شخصی‌سازی نمای تقویم، قلم، صادر کردن فایل پشتیبان و کنترل حریم خصوصی داده‌ها.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* پیکربندی ظاهر و پوسته */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            پیکربندی هویت ظاهری
          </h3>

          <div className="space-y-4 text-xs">
            {/* انتخاب تم ۳ حالته */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-600 dark:text-slate-400 font-bold">حالت نمایشی (پوسته):</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 rounded-2xl p-1 gap-1 border border-slate-200/60 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    mounted && theme === 'light'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>روشن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    mounted && theme === 'dark'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تاریک</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    mounted && theme === 'system'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  <span>سیستم</span>
                </button>
              </div>
            </div>

            {/* اندازه قلم متون */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-bold">اندازه قلم متون:</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 rounded-xl p-1 gap-1 border border-slate-200/60 dark:border-slate-800">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontSize(sz)}
                    className={`px-3 py-1 rounded-lg cursor-pointer transition-all font-bold ${
                      fontSize === sz
                        ? 'bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-300 shadow-sm'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {sz === 'small' ? 'کوچک' : sz === 'large' ? 'بزرگ' : 'متوسط'}
                  </button>
                ))}
              </div>
            </div>

            {/* نوع تقویم پیش‌فرض */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-400 font-bold">نوع تقویم پیش‌فرض:</span>
              <button
                type="button"
                onClick={onToggleCalendarType}
                className="px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-teal-700 dark:text-teal-300 border border-slate-200/60 dark:border-slate-700 cursor-pointer"
              >
                {useJalaliCalendar ? 'خورشیدی (جلالی)' : 'میلادی (Gregorian)'}
              </button>
            </div>
          </div>
        </div>

        {/* صادر کردن داده‌ها و حریم خصوصی */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
            حریم خصوصی داده‌ها و خروجی‌ها
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            تمامی یادداشت‌ها، تسک‌ها، رویدادها و اطلاعات بیولوژیکی شما در دیتابیس مستقل شما محفوظ است. می‌توانید در هر زمان نسخه پشتیبان دریافت کنید.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={onExportBackup}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>خروجی گرفتن فایل JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('آیا مایلید حافظه محلی مرورگر پاک‌سازی شود؟ داده‌های ذخیره‌شده در دیتابیس آسیبی نخواهند دید.')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              پاک‌سازی کش مرورگر
            </button>
          </div>
        </div>

        {/* اطلاعات حساب */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            <span>امنیت و حساب کاربری</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            احراز هویت شما از طریق نشست‌های رمزنگاری‌شده Better Auth در سرور اختصاصی مدیریت می‌شود.
          </p>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            <span className="font-bold text-teal-600 dark:text-teal-400">وضعیت اتصال:</span> متصل به دیتابیس لوکال PostgreSQL (پورت ۵۴۳۳) بدون وابستگی خارجی.
          </div>
        </div>
      </div>
    </div>
  );
}