'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div id="not-found-container" className="min-h-screen bg-slate-50/50 flex flex-col justify-center items-center p-6 text-center select-none font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl space-y-6">
        
        {/* Logo Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-teal-500/10">
          <Sparkles className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">۴۰۴</h1>
          <h2 className="text-xl font-bold text-slate-800">صفحه مورد نظر پیدا نشد</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            آدرس مورد تقاضا در ساختار هوشمند سایبان ثبت نشده است یا احتمالاً برداشته شده است.
          </p>
        </div>

        <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex items-start gap-2.5 text-right">
          <HelpCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed font-medium">
            مفتخریم که اطلاعات و عادات روزمره شما همواره در حافظه باثبات لوکال کورتکس شما محفوظ است. مشکلی از این بابت پدید نیامده است.
          </p>
        </div>

        <Link
          id="btn-back-home-404"
          href="/"
          className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-md cursor-pointer flex items-center justify-center gap-2 text-sm hover:scale-[1.01] transition-transform"
        >
          <span>بازگشت به صفحه اصلی سایبان</span>
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
