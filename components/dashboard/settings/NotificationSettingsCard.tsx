// components/dashboard/settings/NotificationSettingsCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Pill, 
  Calendar, 
  Flame 
} from 'lucide-react';
import {
  isPushNotificationSupported,
  getPushSubscription,
  registerPushSubscription,
  unsubscribePushNotification,
} from '@/lib/notifications/client';
import { getProfile, updateProfile } from '@/lib/api/profiles';

export default function NotificationSettingsCard() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ترجیحات ۳ کانال اعلان
  const [prefs, setPrefs] = useState({
    medicines: true,
    events: true,
    habits: true,
  });

  useEffect(() => {
    async function checkSubAndPrefs() {
      const supported = await isPushNotificationSupported();
      setIsSupported(supported);
      if (supported) {
        const sub = await getPushSubscription();
        setIsSubscribed(!!sub);
      }

      // بارگذاری ترجیحات ذخیره‌شده کاربر از دیتابیس
      const profile = await getProfile();
      if (profile?.notificationPrefs) {
        setPrefs({
          medicines: profile.notificationPrefs.medicines ?? true,
          events: profile.notificationPrefs.events ?? true,
          habits: profile.notificationPrefs.habits ?? true,
        });
      }
    }
    checkSubAndPrefs();
  }, []);

  const handleTogglePush = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      if (isSubscribed) {
        await unsubscribePushNotification();
        setIsSubscribed(false);
        setStatusMsg({ text: 'اعلان‌های این دستگاه غیرفعال شدند.', type: 'success' });
      } else {
        const sub = await registerPushSubscription();
        if (sub) {
          setIsSubscribed(true);
          setStatusMsg({ text: 'اعلان‌های این دستگاه با موفقیت فعال شدند!', type: 'success' });
        } else {
          setStatusMsg({ text: 'مجوز اعلان توسط مرورگر رد شد یا خطایی رخ داد.', type: 'error' });
        }
      }
    } catch (e: any) {
      setStatusMsg({ text: e.message || 'خطا در تغییر وضعیت اعلان', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrefChange = async (key: 'medicines' | 'events' | 'habits', val: boolean) => {
    const nextPrefs = { ...prefs, [key]: val };
    setPrefs(nextPrefs);
    try {
      await updateProfile({ notificationPrefs: nextPrefs });
      setStatusMsg({ text: 'ترجیحات یادآوری با موفقیت به‌روزرسانی شد.', type: 'success' });
    } catch {
      setStatusMsg({ text: 'خطا در ذخیره ترجیحات در سرور.', type: 'error' });
    }
  };

  const handleSendTestPush = async () => {
    setTestLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/notifications/test-push', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: 'اعلان تستی ارسال شد! اعلان را روی مانیتور یا گوشی خود بررسی کنید.', type: 'success' });
      } else {
        setStatusMsg({ text: data.error || 'خطا در ارسال اعلان تستی', type: 'error' });
      }
    } catch {
      setStatusMsg({ text: 'خطا در ارتباط با سرور', type: 'error' });
    } finally {
      setTestLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 text-amber-500 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>مرورگر فعلی شما از وب‌پوش یا سرویس‌ورکر پشتیبانی نمی‌کند (در iOS ابتدا برنامه را به صفحه اصلی اضافه کنید).</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5 text-right" dir="rtl">
      {/* ردیف دکمه اصلی فعال‌سازی */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">اعلان‌ها و یادآوری‌های هوشمند</h4>
            <p className="text-xs text-slate-400 mt-0.5">دریافت هشدار مصرف داروها، رویدادهای مهم و حفظ استریک روزانه</p>
          </div>
        </div>

        <button
          onClick={handleTogglePush}
          disabled={loading}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            isSubscribed
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800'
              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20'
          }`}
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{isSubscribed ? 'غیرفعال‌سازی در این دستگاه' : 'فعال‌سازی اعلان‌ها'}</span>
        </button>
      </div>

      {/* بخش وضعیت اتصال و تست فوری */}
      {isSubscribed && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            دستگاه شما به سیستم نوتیفیکیشن متصل است.
          </span>

          <button
            onClick={handleSendTestPush}
            disabled={testLoading}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {testLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-teal-500" />}
            <span>ارسال اعلان تستی فوری</span>
          </button>
        </div>
      )}

      {/* تاگل‌های تفکیک‌شده ۳ کانال اعلان */}
      <div className="pt-2 space-y-3">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
          کانال‌های یادآوری فعال برای شما:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Pill className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">یادآوری داروها</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.medicines}
              onChange={(e) => handlePrefChange('medicines', e.target.checked)}
              className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">رویدادهای تقویم</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.events}
              onChange={(e) => handlePrefChange('events', e.target.checked)}
              className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">هشدار عادات</span>
            </div>
            <input
              type="checkbox"
              checked={prefs.habits}
              onChange={(e) => handlePrefChange('habits', e.target.checked)}
              className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs font-bold text-center ${
          statusMsg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
        }`}>
          {statusMsg.text}
        </div>
      )}
    </div>
  );
}