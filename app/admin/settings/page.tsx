'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Save, AlertCircle, Sparkles, Shield, Wrench, Zap } from 'lucide-react';
import AiProvidersManager from '@/components/admin/AiProvidersManager';

export default function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [featureFlags, setFeatureFlags] = useState({
    enable_ai_assistant: true,
    enable_gemini_fallback: true,
    free_tier_daily_limit: 15,
    maintenance_mode: false
  });

  const supabase = createClient();

  async function fetchSettings() {
    setLoading(true);
    try {
      const { data: flagsData, error } = await (supabase.from('global_settings') as any)
        .select('value')
        .eq('id', 'feature_flags')
        .maybeSingle();

      if (flagsData?.value) {
        setFeatureFlags({
          enable_ai_assistant: flagsData.value.enable_ai_assistant ?? true,
          enable_gemini_fallback: flagsData.value.enable_gemini_fallback ?? true,
          free_tier_daily_limit: flagsData.value.free_tier_daily_limit ?? 15,
          maintenance_mode: flagsData.value.maintenance_mode ?? false
        });
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMsg(null);

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
      setToastMsg({ text: 'تنظیمات و سهمیه‌های سیستم با موفقیت ذخیره و اعمال شدند.', type: 'success' });
    } catch (err: any) {
      setToastMsg({ text: `خطا در ذخیره‌سازی: ${err.message}`, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6" dir="rtl">
      <header className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white">تنظیمات و پیکربندی سامانه</h1>
        <p className="text-xs text-slate-400 mt-1">مدیریت زنجیره هوش مصنوعی، سهمیه‌ها و کلیدهای کنترل سراسری اپلیکیشن</p>
      </header>

      {/* ۱. ماژول مدیریت ارائه‌دهندگان هوش مصنوعی */}
      <AiProvidersManager />

      {/* ۲. ماژول قابلیت‌های سیستم و سهمیه‌ها */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-right">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">کلیدهای کنترل سراسری (Feature Flags)</h3>
              <p className="text-xs text-slate-400">تنظیم محدودیت‌ها و سوییچ‌های لحظه‌ای سیستم</p>
            </div>
          </div>
        </div>

        {toastMsg && (
          <div className={`p-3.5 rounded-xl text-xs font-bold text-center ${toastMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'}`}>
            {toastMsg.text}
          </div>
        )}

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
                <span className="text-[11px] text-slate-400 block">فعال/غیرفعال‌سازی کلی چت و فرامین هوشمند</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.enable_ai_assistant}
                onChange={(e) => setFeatureFlags({ ...featureFlags, enable_ai_assistant: e.target.checked })}
                className="w-5 h-5 text-teal-600 rounded-lg accent-teal-500 cursor-pointer"
              />
            </label>

            {/* سوییچ سپر نجات جمینای */}
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span>سپر نجات Gemini سرور (Fallback)</span>
                </span>
                <span className="text-[11px] text-slate-400 block">سوئیچ خودکار به جمینای در صورت خرابی سایر مدل‌ها</span>
              </div>
              <input
                type="checkbox"
                checked={featureFlags.enable_gemini_fallback}
                onChange={(e) => setFeatureFlags({ ...featureFlags, enable_gemini_fallback: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded-lg accent-indigo-500 cursor-pointer"
              />
            </label>

            {/* سقف سهمیه کاربران رایگان */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>سقف روزانه پلن رایگان</span>
                </span>
                <span className="text-[11px] text-slate-400 block">تعداد مجاز پیام کاربر عادی در ۲۴ ساعت</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={featureFlags.free_tier_daily_limit}
                  onChange={(e) => setFeatureFlags({ ...featureFlags, free_tier_daily_limit: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-16 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-white text-xs font-bold focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">پیام</span>
              </div>
            </div>

            {/* حالت تعمیر و نگهداری */}
            <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-rose-400" />
                  <span>حالت تعمیر و ارتقای سامانه</span>
                </span>
                <span className="text-[11px] text-slate-400 block">نمایش اعلان حالت نگهداری به کاربران</span>
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

        {/* دکمه ذخیره کلیدهای کنترلی */}
        <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
          <button
            type="submit"
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
        </div>
      </form>
    </div>
  );
}