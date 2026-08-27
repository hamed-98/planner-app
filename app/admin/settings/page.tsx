'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Save, AlertCircle, Sparkles, Shield, Wrench, Share2 } from 'lucide-react';
import AiProvidersManager from '@/components/admin/AiProvidersManager';

export default function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [featureFlags, setFeatureFlags] = useState({
    enable_ai_assistant: true,
    enable_sharing: false,
    free_tier_daily_limit: 15,
    maintenance_mode: false
  });

  const supabase = createClient();

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data: flagsData } = await (supabase.from('global_settings') as any)
        .select('value')
        .eq('id', 'feature_flags')
        .maybeSingle();

      if (flagsData?.value) {
        setFeatureFlags({
          enable_ai_assistant: flagsData.value.enable_ai_assistant ?? flagsData.value.enable_gemini ?? true,
          enable_sharing: flagsData.value.enable_sharing ?? false,
          free_tier_daily_limit: flagsData.value.free_tier_daily_limit ?? flagsData.value.ai_daily_limit ?? 15,
          maintenance_mode: flagsData.value.maintenance_mode ?? false
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await (supabase.from('global_settings') as any).upsert(
        {
          id: 'feature_flags',
          value: featureFlags,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

      if (error) throw error;
      setMessage({ text: 'قابلیت‌های سیستم با موفقیت ذخیره شدند.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: `خطا در ذخیره تنظیمات: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6" dir="rtl">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">تنظیمات و پیکربندی سامانه</h1>
        <p className="text-xs text-slate-400 mt-1">مدیریت زنجیره هوش مصنوعی، سهمیه‌ها و کلیدهای کنترل سراسری اپلیکیشن</p>
      </header>

      {/* ۱. ماژول تمام‌عرض و اختصاصی مدیریت هوش مصنوعی */}
      <AiProvidersManager />

      {/* ۲. ماژول قابلیت‌های سیستم (Feature Flags) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-right">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">کلیدهای کنترل سراسری (Feature Flags)</h3>
              <p className="text-xs text-slate-400">تنظیم محدودیت‌ها و سوییچ‌های لحظه‌ای سیستم بدون نیاز به دیپلوی مجدد</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-xs text-slate-400 font-bold py-6 text-center animate-pulse">در حال فراخوانی تنظیمات...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* سوییچ هوش مصنوعی */}
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>سرویس دستیار هوش مصنوعی</span>
                </span>
                <span className="text-[11px] text-slate-400 block">فعال بودن ماژول چت و پردازش فرامین صوتی</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.enable_ai_assistant}
                onChange={(e) => setFeatureFlags({ ...featureFlags, enable_ai_assistant: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded-lg accent-teal-500 cursor-pointer"
              />
            </label>

            {/* سوییچ اشتراک‌گذاری */}
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>اشتراک‌گذاری پلن‌ها و رویدادها</span>
                </span>
                <span className="text-[11px] text-slate-400 block">امکان ساخت لینک عمومی برای تقویم و یادداشت‌ها</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.enable_sharing}
                onChange={(e) => setFeatureFlags({ ...featureFlags, enable_sharing: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded-lg accent-teal-500 cursor-pointer"
              />
            </label>

            {/* سقف مجاز کاربران رایگان */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>سقف سهمیه روزانه پلن رایگان</span>
                </span>
                <span className="text-[11px] text-slate-400 block">تعداد مجاز درخواست در هر ۲۴ ساعت</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={featureFlags.free_tier_daily_limit}
                  onChange={(e) => setFeatureFlags({ ...featureFlags, free_tier_daily_limit: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-16 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">پیام</span>
              </div>
            </div>

            {/* حالت تعمیرات */}
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-rose-400" />
                  <span>حالت تعمیر و نگهداری (Maintenance)</span>
                </span>
                <span className="text-[11px] text-slate-400 block">نمایش صفحه دردسترس نبودن برای کاربران عادی</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.maintenance_mode}
                onChange={(e) => setFeatureFlags({ ...featureFlags, maintenance_mode: e.target.checked })}
                className="w-5 h-5 text-rose-600 rounded-lg accent-rose-500 cursor-pointer"
              />
            </label>

          </div>
        )}

        {/* دکمه ذخیره تنظیمات */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-teal-600/20"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>ذخیره کلیدهای کنترلی</span>
          </button>
          
          {message && (
            <span className={`text-xs font-bold ${message.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}