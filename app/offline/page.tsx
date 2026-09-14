'use client';

import React from 'react';
import { WifiOff, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans text-slate-800 dark:text-slate-100">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
        {/* آیکون آفلاین */}
        <div className="w-20 h-20 mx-auto mb-6 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center shadow-inner">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        {/* عنوان و توضیحات */}
        <h1 className="text-2xl font-bold mb-3 tracking-tight">اتصال به اینترنت برقرار نیست</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          به نظر می‌رسد اینترنت شما قطع شده است. این صفحه قبلاً در حافظه دستگاه ذخیره نشده بود. با برقراری اتصال مجدد، می‌توانید صفحه را بارگذاری کنید.
        </p>

        {/* دکمه‌های اقدام */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleReload}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تلاش مجدد</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>بازگشت به داشبورد</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* توضیح کارکرد آفلاین */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            💡 اگر قبلاً وارد داشبورد شده‌اید، اطلاعات شما روی حافظه محلی در دسترس است.
          </p>
        </div>
      </div>
    </div>
  );
}
