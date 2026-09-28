// components/admin/NotificationPoliciesManager.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  Save, 
  Moon, 
  Clock, 
  Pill, 
  Calendar, 
  Flame, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Send,
  Users
} from 'lucide-react';
import { 
  NotificationPolicy, 
  DEFAULT_NOTIFICATION_POLICIES 
} from '@/lib/notifications/template';

interface AdminNotificationStats {
  activeSubscriptions: number;
  delivered24h: number;
  dropped24h: number;
  expired24h: number;
  failed24h: number;
}

export default function NotificationPoliciesManager() {
  const [policies, setPolicies] = useState<NotificationPolicy>(DEFAULT_NOTIFICATION_POLICIES);
  const [stats, setStats] = useState<AdminNotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ارجاع به اینپوت‌ها برای درج متغیر در محل دقیق نشانگر
  const medInputRef = useRef<HTMLInputElement>(null);
  const eventInputRef = useRef<HTMLInputElement>(null);
  const habitInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [policyRes, statsRes] = await Promise.all([
          fetch('/api/settings?id=notification_policies', { cache: 'no-store' }),
          fetch('/api/admin/notifications/stats', { cache: 'no-store' }).catch(() => null)
        ]);

        if (policyRes.ok) {
          const data = await policyRes.json();
          if (data && data.channels) {
            setPolicies(data);
          }
        }

        if (statsRes && statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch {
        showToast('خطا در بارگذاری اطلاعات پنل اعلان‌ها', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // اعتبارسنجی پیش از ذخیره
  const validate = (): boolean => {
    const q = policies.quietHours;
    if (q.enabled && (!q.start || !q.end || !q.start.includes(':') || !q.end.includes(':'))) {
      showToast('ساعات سکوت محلی به درستی تکمیل نشده است.', 'error');
      return false;
    }
    if (policies.channels.events.offsetMinutes < 1 || policies.channels.events.offsetMinutes > 180) {
      showToast('فاصله یادآوری رویداد باید بین ۱ تا ۱۸۰ دقیقه باشد.', 'error');
      return false;
    }
    if (!policies.channels.medicines.template.trim()) {
      showToast('قالب یادآوری داروها نمی‌تواند خالی باشد.', 'error');
      return false;
    }
    return true;
  };

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingId: 'notification_policies',
          value: policies,
        }),
      });

      if (!res.ok) throw new Error('پاسخ ناموفق از سرور');
      showToast('سیاست‌های اعلان با موفقیت ذخیره شد.', 'success');
    } catch (err: any) {
      showToast(`خطا در ذخیره تنظیمات: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // درج هوشمند متغیر در محل دقیق کرسر موس
  const insertVariableAtCursor = (
    channelKey: 'medicines' | 'events' | 'habits',
    ref: React.RefObject<HTMLInputElement | null>,
    tag: string
  ) => {
    const input = ref.current;
    const currentText = policies.channels[channelKey].template;
    
    if (!input) {
      setPolicies(prev => ({
        ...prev,
        channels: {
          ...prev.channels,
          [channelKey]: { ...prev.channels[channelKey], template: `${currentText} ${tag}`.trim() }
        }
      }));
      return;
    }

    const start = input.selectionStart ?? currentText.length;
    const end = input.selectionEnd ?? currentText.length;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    setPolicies(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channelKey]: { ...prev.channels[channelKey], template: newText }
      }
    }));

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  // ارسال تست آنی برای راستی‌آزمایی قالب‌ها روی سیستم ادمین
  const handleTestTemplate = async (channel: string) => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/notifications/test-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, previewPolicy: policies }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`اعلان تستی قالب «${channel}» به مرورگر شما شلیک شد.`, 'success');
      } else {
        showToast(data.error || 'خطا در شلیک تستی', 'error');
      }
    } catch {
      showToast('ارتباط با سرور برای تست برقرار نشد.', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 font-bold animate-pulse">
        در حال بارگذاری تنظیمات و آمار تحویل اعلان‌ها...
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
      {/* هدر */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>مدیریت خط‌مشی‌ها و قالب‌های اعلان (Push Center)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              کنترل سراسری کانال‌ها، تنظیم ساعات سکوت و شخصی‌سازی متن پیام‌ها
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/20 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'در حال ذخیره...' : 'ذخیره خط‌مشی‌ها'}</span>
        </button>
      </div>

      {toastMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold text-center ${
          toastMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'
        }`}>
          {toastMsg.text}
        </div>
      )}

      {/* کارت‌های خلاصه آمار عملکرد ۲۴ ساعت گذشته */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-teal-400" /> دستگاه‌های مشترک فعال
            </span>
            <div className="text-lg font-black text-white font-mono">{stats.activeSubscriptions}</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> تحویل موفق (۲۴h)
            </span>
            <div className="text-lg font-black text-emerald-400 font-mono">{stats.delivered24h}</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> فیلتر ساعت سکوت
            </span>
            <div className="text-lg font-black text-indigo-400 font-mono">{stats.dropped24h}</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> کهنه / منقضی شده
            </span>
            <div className="text-lg font-black text-amber-400 font-mono">{stats.expired24h}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ۱. ساعات سکوت */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Moon className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black text-white">ساعات سکوت شبانه محلی (Quiet Hours)</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
              <input
                type="checkbox"
                checked={policies.quietHours.enabled}
                onChange={e => setPolicies({
                  ...policies,
                  quietHours: { ...policies.quietHours, enabled: e.target.checked }
                })}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
              <span>فعال‌سازی ساعت سکوت</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">شروع سکوت (به وقت کاربر):</label>
              <input
                type="time"
                value={policies.quietHours.start}
                onChange={e => setPolicies({
                  ...policies,
                  quietHours: { ...policies.quietHours, start: e.target.value }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">پایان سکوت (به وقت کاربر):</label>
              <input
                type="time"
                value={policies.quietHours.end}
                onChange={e => setPolicies({
                  ...policies,
                  quietHours: { ...policies.quietHours, end: e.target.value }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* ۲. داروها */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Pill className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black text-white">یادآوری مصرف داروها (Medicines)</h4>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isTesting}
                onClick={() => handleTestTemplate('medicines')}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" /> تست این قالب
              </button>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={policies.channels.medicines.enabled}
                  onChange={e => setPolicies({
                    ...policies,
                    channels: {
                      ...policies.channels,
                      medicines: { ...policies.channels.medicines, enabled: e.target.checked }
                    }
                  })}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
                <span>کانال فعال</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">رفتار در ساعت سکوت:</label>
              <select
                value={policies.channels.medicines.quietHoursMode}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    medicines: { ...policies.channels.medicines, quietHoursMode: e.target.value as any }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="silent">بی‌صدا و بدون لرزش (Silent)</option>
                <option value="drop">عدم ارسال در ساعت سکوت (Drop)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-400">قالب متن اعلان:</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">افزودن متغیر:</span>
                  {['{name}', '{dosage}', '{time}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariableAtCursor('medicines', medInputRef, tag)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-teal-400 hover:bg-slate-700 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <input
                ref={medInputRef}
                type="text"
                value={policies.channels.medicines.template}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    medicines: { ...policies.channels.medicines, template: e.target.value }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* ۳. رویدادها */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-black text-white">رویدادهای تقویم (Events)</h4>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isTesting}
                onClick={() => handleTestTemplate('events')}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" /> تست این قالب
              </button>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={policies.channels.events.enabled}
                  onChange={e => setPolicies({
                    ...policies,
                    channels: {
                      ...policies.channels,
                      events: { ...policies.channels.events, enabled: e.target.checked }
                    }
                  })}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
                <span>کانال فعال</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">ارسال (دقیقه قبل از شروع):</label>
              <input
                type="number"
                min={1}
                max={180}
                value={policies.channels.events.offsetMinutes}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    events: { ...policies.channels.events, offsetMinutes: Math.max(1, Number(e.target.value) || 1) }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">رفتار در ساعت سکوت:</label>
              <select
                value={policies.channels.events.quietHoursMode}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    events: { ...policies.channels.events, quietHoursMode: e.target.value as any }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="drop">عدم ارسال در ساعت سکوت (Drop)</option>
                <option value="silent">بی‌صدا و بدون لرزش (Silent)</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-400">قالب متن:</label>
                <div className="flex items-center gap-1.5">
                  {['{title}', '{offset}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariableAtCursor('events', eventInputRef, tag)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-teal-400 hover:bg-slate-700 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <input
                ref={eventInputRef}
                type="text"
                value={policies.channels.events.template}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    events: { ...policies.channels.events, template: e.target.value }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* ۴. عادات */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-black text-white">نجات استریک عادات روزانه (Habits)</h4>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isTesting}
                onClick={() => handleTestTemplate('habits')}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Send className="w-3 h-3" /> تست این قالب
              </button>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300">
                <input
                  type="checkbox"
                  checked={policies.channels.habits.enabled}
                  onChange={e => setPolicies({
                    ...policies,
                    channels: {
                      ...policies.channels,
                      habits: { ...policies.channels.habits, enabled: e.target.checked }
                    }
                  })}
                  className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
                />
                <span>کانال فعال</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">ساعت هشدار شبانه (محلی):</label>
              <input
                type="time"
                value={policies.channels.habits.triggerHourLocal}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    habits: { ...policies.channels.habits, triggerHourLocal: e.target.value }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5">رفتار در ساعت سکوت:</label>
              <select
                value={policies.channels.habits.quietHoursMode}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    habits: { ...policies.channels.habits, quietHoursMode: e.target.value as any }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white font-bold focus:outline-none focus:border-teal-500"
              >
                <option value="drop">عدم ارسال در ساعت سکوت (Drop)</option>
                <option value="silent">بی‌صدا و بدون لرزش (Silent)</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-400">قالب متن:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertVariableAtCursor('habits', habitInputRef, '{pendingCount}')}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-teal-400 hover:bg-slate-700 cursor-pointer"
                  >
                    {'{pendingCount}'}
                  </button>
                </div>
              </div>
              <input
                ref={habitInputRef}
                type="text"
                value={policies.channels.habits.template}
                onChange={e => setPolicies({
                  ...policies,
                  channels: {
                    ...policies.channels,
                    habits: { ...policies.channels.habits, template: e.target.value }
                  }
                })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}