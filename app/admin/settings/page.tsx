'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { Key, Save, AlertCircle } from 'lucide-react';

export default function SettingsManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    supabase_service_role: ''
  });
  
  const [featureFlags, setFeatureFlags] = useState({
    enable_gemini: true,
    enable_sharing: false,
    ai_daily_limit: 5
  });

  const supabase = createClient();

  async function fetchSettings() {
    setLoading(true);
    const { data: keysData } = await supabase.from('global_settings').select('value').eq('id', 'api_keys').single() as any;
    if (keysData?.value) setApiKeys(keysData.value);

    const { data: flagsData } = await supabase.from('global_settings').select('value').eq('id', 'feature_flags').single() as any;
    if (flagsData?.value) {
      setFeatureFlags({
        enable_gemini: flagsData.value.enable_gemini ?? true,
        enable_sharing: flagsData.value.enable_sharing ?? false,
        ai_daily_limit: flagsData.value.ai_daily_limit ?? 5
      });
    }
    
    setLoading(false);
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    const { error: err1 } = await (supabase.from('global_settings') as any).upsert({ id: 'api_keys', value: apiKeys });
    const { error: err2 } = await (supabase.from('global_settings') as any).upsert({ id: 'feature_flags', value: featureFlags });
    
    if (err1 || err2) {
      setMessage('خطا در ذخیره تنظیمات');
    } else {
      setMessage('تنظیمات با موفقیت ذخیره شد');
    }
    setSaving(false);
    
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white">تنظیمات سامانه</h1>
        <p className="text-sm text-slate-400 mt-1">پیکربندی کلیدها و قابلیت‌های سراسری اپلیکیشن</p>
      </header>

      {loading ? (
        <div className="text-slate-400">در حال بارگذاری...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* API Keys */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">کلیدهای API</h3>
                <p className="text-xs text-slate-400">تنظیمات اتصال به سرویس‌های خارجی</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Google Gemini API Key</label>
                <input 
                  type="password"
                  value={apiKeys.gemini}
                  onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-white focus:outline-none focus:border-teal-500"
                  dir="ltr"
                  placeholder="AIzaSy..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Supabase Service Role Key</label>
                <input 
                  type="password"
                  value={apiKeys.supabase_service_role}
                  onChange={(e) => setApiKeys({...apiKeys, supabase_service_role: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-white focus:outline-none focus:border-teal-500"
                  dir="ltr"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                />
              </div>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">قابلیت‌های سیستم (Feature Flags)</h3>
                <p className="text-xs text-slate-400">فعال یا غیرفعال کردن بخش‌های اپلیکیشن</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="block text-sm font-medium text-white">دستیار هوش مصنوعی (Gemini)</span>
                  <span className="text-xs text-slate-400">امکان چت و برنامه‌ریزی هوشمند</span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={featureFlags.enable_gemini} onChange={(e) => setFeatureFlags({...featureFlags, enable_gemini: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="block text-sm font-medium text-white">اشتراک‌گذاری رویدادها</span>
                  <span className="text-xs text-slate-400">تیم ورک و اشتراک پلن با دوستان</span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={featureFlags.enable_sharing} onChange={(e) => setFeatureFlags({...featureFlags, enable_sharing: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                </div>
              </label>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <span className="block text-sm font-medium text-white">سقف درخواست روزانه هوش مصنوعی</span>
                    <span className="text-xs text-slate-400">حداکثر دفعات مجاز استفاده هر کاربر از دستیار کورتکس در ۲۴ ساعت</span>
                  </div>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    value={featureFlags.ai_daily_limit} 
                    onChange={(e) => setFeatureFlags({...featureFlags, ai_daily_limit: Math.max(1, parseInt(e.target.value, 10) || 5)})}
                    className="w-20 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-center text-white text-xs focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Action */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
          <span>ذخیره تغییرات</span>
        </button>
        {message && <span className={`text-sm ${message.includes('خطا') ? 'text-rose-400' : 'text-emerald-400'}`}>{message}</span>}
      </div>
    </div>
  );
}
