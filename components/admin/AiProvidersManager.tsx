'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Power, 
  ArrowUp, 
  ArrowDown, 
  Key, 
  Globe, 
  Cpu, 
  Clock, 
  Layers,
  Save
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AiProviderConfig } from '@/lib/ai/gateway';

// الگوهای آماده برای سرعت عمل ادمین
const PROVIDER_PRESETS = [
  {
    name: 'ZenMux (GLM-4.7 Flash Free)',
    providerType: 'openai_compatible' as const,
    baseUrl: 'https://api.zenmux.ai/v1',
    model: 'z-ai/glm-4.7-flash-free',
    timeoutMs: 15000
  },
  {
    name: 'DeepSeek Chat (V3)',
    providerType: 'openai_compatible' as const,
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    timeoutMs: 15000
  },
  {
    name: 'OpenRouter (Qwen 2.5 72B Free/Paid)',
    providerType: 'openai_compatible' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'qwen/qwen-2.5-72b-instruct',
    timeoutMs: 15000
  },
  {
    name: 'Google Gemini 2.5 Flash Native',
    providerType: 'gemini_native' as const,
    baseUrl: '',
    model: 'gemini-2.5-flash',
    timeoutMs: 12000
  }
];

export default function AiProvidersManager() {
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // فرم ایجاد/ویرایش
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AiProviderConfig>>({
    name: '',
    providerType: 'openai_compatible',
    baseUrl: 'https://api.zenmux.ai/v1',
    apiKey: '',
    model: '',
    priority: 1,
    isActive: true,
    timeoutMs: 15000
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // لود تنظیمات از دیتابیس
  useEffect(() => {
    async function loadProviders() {
      setIsLoading(true);
      const supabase = createClient();
      try {
        const { data } = await (supabase.from('global_settings') as any)
          .select('value')
          .eq('id', 'ai_providers')
          .maybeSingle();

        if (data?.value && Array.isArray(data.value)) {
          setProviders(data.value.sort((a: any, b: any) => a.priority - b.priority));
        } else {
          setProviders([]);
        }
      } catch (err) {
        showToast('خطا در دریافت لیست پرووایدرها', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadProviders();
  }, []);

  // ذخیره لیست در دیتابیس
  const saveProvidersToDb = async (updatedList: AiProviderConfig[]) => {
    setIsSaving(true);
    const supabase = createClient();
    try {
      const { error } = await (supabase.from('global_settings') as any).upsert(
        {
          id: 'ai_providers',
          value: updatedList,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      );

      if (error) throw error;
      setProviders(updatedList);
      showToast('پیکربندی هوش مصنوعی ذخیره و فوراً اعمال شد.', 'success');
    } catch (err: any) {
      showToast(`خطا در ذخیره‌سازی: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      id: `ai-provider-${Date.now()}`,
      name: '',
      providerType: 'openai_compatible',
      baseUrl: 'https://api.zenmux.ai/v1',
      apiKey: '',
      model: '',
      priority: providers.length + 1,
      isActive: true,
      timeoutMs: 15000
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: AiProviderConfig) => {
    setEditingId(p.id);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      name: preset.name,
      providerType: preset.providerType,
      baseUrl: preset.baseUrl,
      model: preset.model,
      timeoutMs: preset.timeoutMs
    }));
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.apiKey?.trim() || !formData.model?.trim()) {
      showToast('لطفاً نام، کلید API و شناسه مدل را تکمیل فرمایید.', 'error');
      return;
    }

    let updated: AiProviderConfig[];
    if (editingId) {
      updated = providers.map(p => p.id === editingId ? { ...p, ...formData } as AiProviderConfig : p);
    } else {
      updated = [...providers, { ...formData, id: formData.id || `provider-${Date.now()}` } as AiProviderConfig];
    }

    updated.sort((a, b) => a.priority - b.priority);
    saveProvidersToDb(updated);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('آیا از حذف این سرویس هوش مصنوعی اطمینان دارید؟')) return;
    const updated = providers.filter(p => p.id !== id);
    saveProvidersToDb(updated);
  };

  const handleToggleActive = (id: string) => {
    const updated = providers.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    saveProvidersToDb(updated);
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= providers.length) return;

    const listCopy = [...providers];
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIdx];
    listCopy[targetIdx] = temp;

    // شماره‌گذاری مجدد اولویت‌ها
    const reordered = listCopy.map((item, idx) => ({ ...item, priority: idx + 1 }));
    saveProvidersToDb(reordered);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
      
      {/* هدر بخش مدیریت هوش مصنوعی */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              مدیریت زنجیره هوش مصنوعی (Universal AI Gateway)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              مدل‌های رایگان یا تجاری را اضافه کنید؛ درخواست‌ها به ترتیب اولویت فراخوانی شده و در صورت لیمیت خودکار سوییچ می‌شوند.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مدل جدید</span>
        </button>
      </div>

      {toastMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold text-center ${toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* لیست پرووایدرهای ثبت‌شده */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold animate-pulse">
          در حال بارگذاری دروازه هوش مصنوعی...
        </div>
      ) : providers.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Sparkles className="w-8 h-8 text-teal-500 opacity-40 mx-auto" />
          <p className="text-xs text-slate-500 font-bold">هیچ ارائه‌دهنده‌ای هنوز اضافه نشده است.</p>
          <button
            onClick={handleOpenAdd}
            className="text-xs text-teal-600 font-bold hover:underline"
          >
            افزودن اولین مدل (مثلاً ZenMux رایگان)
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {providers.map((p, idx) => (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                p.isActive 
                  ? 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 shadow-sm' 
                  : 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-mono font-black text-slate-600 dark:text-slate-300">
                  {idx + 1}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{p.name}</h4>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                      {p.model}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.providerType === 'gemini_native' ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'}`}>
                      {p.providerType === 'gemini_native' ? 'Gemini Native' : 'OpenAI Compatible'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span>Base: {p.baseUrl || 'Google AI Studio'}</span>
                    <span>•</span>
                    <span>Key: {p.apiKey.slice(0, 6)}...{p.apiKey.slice(-4)}</span>
                    <span>•</span>
                    <span>Timeout: {p.timeoutMs || 15000}ms</span>
                  </div>
                </div>
              </div>

              {/* کنترل اولویت و اکشن‌ها */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {/* دکمه‌های ترتیب اولویت */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMovePriority(idx, 'up')}
                    className="p-1 text-slate-500 hover:text-teal-600 disabled:opacity-20 cursor-pointer"
                    title="افزایش اولویت"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === providers.length - 1}
                    onClick={() => handleMovePriority(idx, 'down')}
                    className="p-1 text-slate-500 hover:text-teal-600 disabled:opacity-20 cursor-pointer"
                    title="کاهش اولویت"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* فعال / غیرفعال */}
                <button
                  onClick={() => handleToggleActive(p.id)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${p.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  title={p.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                {/* ویرایش */}
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 rounded-xl transition-colors cursor-pointer"
                  title="ویرایش پیکربندی"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* حذف */}
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مدال ایجاد / ویرایش پرووایدر */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {editingId ? 'ویرایش ارائه‌دهنده هوش مصنوعی' : 'افزودن ارائه‌دهنده جدید'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* کلیدهای سریع برای انتخاب الگو */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1.5">الگوهای آماده و سریع:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {PROVIDER_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold transition-all text-right truncate cursor-pointer"
                  >
                    ⚡ {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">نام نمایشی:</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثلاً: ZenMux Free"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع پروتکل:</label>
                  <select
                    value={formData.providerType}
                    onChange={e => setFormData({ ...formData, providerType: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-teal-500"
                  >
                    <option value="openai_compatible">OpenAI-Compatible (ZenMux, DeepSeek, Qwen)</option>
                    <option value="gemini_native">Google Gemini Native SDK</option>
                  </select>
                </div>
              </div>

              {formData.providerType === 'openai_compatible' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">آدرس Base URL:</label>
                  <input
                    type="text"
                    required
                    value={formData.baseUrl || ''}
                    onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://api.zenmux.ai/v1"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">شناسه دقیق مدل (Model ID):</label>
                  <input
                    type="text"
                    required
                    value={formData.model || ''}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    placeholder="z-ai/glm-4.7-flash-free"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">حداکثر زمان انتظار (Timeout ms):</label>
                  <input
                    type="number"
                    value={formData.timeoutMs || 15000}
                    onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">کلید اختصاصی API (API Key):</label>
                <input
                  type="password"
                  required
                  value={formData.apiKey || ''}
                  onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره و اعمال در سامانه'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}