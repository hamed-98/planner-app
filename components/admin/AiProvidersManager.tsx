// components/admin/AiProvidersManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  Power, 
  ArrowUp, 
  ArrowDown, 
  Layers,
  Save,
  X,
  Zap,
  Clock,
  Globe
} from 'lucide-react';
import { AiProviderConfig } from '@/lib/ai/gateway';

const PROVIDER_PRESETS = [
  {
    name: 'OpenRouter (Qwen 2.5 72B Free)',
    providerType: 'openai_compatible' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'qwen/qwen-2.5-72b-instruct:free',
    timeoutMs: 15000
  },
  {
    name: 'OpenRouter (GLM-5.2 Free)',
    providerType: 'openai_compatible' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'z-ai/glm-5.2:free',
    timeoutMs: 15000
  },
  {
    name: 'DeepSeek Chat (V3 Official)',
    providerType: 'openai_compatible' as const,
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    timeoutMs: 15000
  },
  {
    name: 'Google Gemini 3.7 Flash Native',
    providerType: 'gemini_native' as const,
    baseUrl: '',
    model: 'gemini-3.7-flash',
    timeoutMs: 12000
  }
];

export default function AiProvidersManager() {
  const [providers, setProviders] = useState<AiProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [showApiKey, setShowApiKey] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AiProviderConfig>>({
    name: '',
    providerType: 'openai_compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
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

  useEffect(() => {
    async function loadProviders() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.ai_providers && Array.isArray(data.ai_providers)) {
            setProviders(data.ai_providers.sort((a: any, b: any) => a.priority - b.priority));
          } else {
            setProviders([]);
          }
        } else {
          showToast('خطا در دریافت لیست پرووایدرها', 'error');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadProviders();
  }, []);

  const saveProvidersToDb = async (updatedList: AiProviderConfig[]) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingId: 'ai_providers',
          value: updatedList,
        }),
      });

      if (!res.ok) throw new Error('پاسخ ناموفق از سرور');

      setProviders(updatedList);
      showToast('پیکربندی هوش مصنوعی ذخیره و فوراً فعال شد.', 'success');
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
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      model: '',
      priority: 1,
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
      const newProvider = { ...formData, id: formData.id || `provider-${Date.now()}`, priority: 1 } as AiProviderConfig;
      const shifted = providers.map(p => ({ ...p, priority: p.priority + 1 }));
      updated = [newProvider, ...shifted];
    }

    updated.sort((a, b) => a.priority - b.priority);
    const cleanIndexed = updated.map((item, idx) => ({ ...item, priority: idx + 1 }));

    saveProvidersToDb(cleanIndexed);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm('آیا از حذف این سرویس هوش مصنوعی اطمینان دارید؟')) return;
    const updated = providers.filter(p => p.id !== id).map((item, idx) => ({ ...item, priority: idx + 1 }));
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

    const reordered = listCopy.map((item, idx) => ({ ...item, priority: idx + 1 }));
    saveProvidersToDb(reordered);
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm space-y-6 text-right" dir="rtl">
      
      {/* هدر بخش مدیریت هوش مصنوعی */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>زنجیره هوش مصنوعی پویا (AI Gateway)</span>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 font-mono px-2 py-0.5 rounded-full">
                {providers.filter(p => p.isActive).length} مدل فعال
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              درخواست‌ها به ترتیب اولویت شماره ۱ تا انتها ارسال می‌شوند؛ در صورت خطای ۴۲۹ یا تاخیر، بدون قطعی به مدل بعدی منتقل خواهند شد.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مدل به اول صف</span>
        </button>
      </div>

      {toastMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold text-center ${toastMsg.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-rose-950/80 text-rose-300 border border-rose-800'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* لیست پرووایدرها */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-bold animate-pulse">
          در حال بازخوانی دروازه هوش مصنوعی...
        </div>
      ) : providers.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-slate-950 rounded-2xl border border-dashed border-slate-800">
          <Sparkles className="w-8 h-8 text-teal-500 opacity-40 mx-auto" />
          <p className="text-xs text-slate-400 font-bold">هیچ مدلی در دیتابیس ثبت نشده است (سیستم از جمینای پیش‌فرض سرور استفاده می‌کند).</p>
          <button
            onClick={handleOpenAdd}
            className="text-xs text-teal-400 font-bold hover:underline"
          >
            افزودن مدل جدید (مثل OpenRouter یا ZenMux)
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pl-1 pr-0.5">
          {providers.map((p, idx) => (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                p.isActive 
                  ? 'bg-slate-950 border-slate-800 hover:border-slate-700 shadow-sm' 
                  : 'bg-slate-950/40 border-slate-850 opacity-40'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-black ${idx === 0 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                  {idx + 1}
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-black text-white">{p.name}</h4>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                      {p.model}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.providerType === 'gemini_native' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' : 'bg-teal-950 text-teal-400 border border-teal-800'}`}>
                      {p.providerType === 'gemini_native' ? 'Gemini Native' : 'OpenAI-Compatible'}
                    </span>
                    {idx === 0 && p.isActive && (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        ★ اولویت اول پاسخ‌دهی
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono flex-wrap">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-500" />
                      {p.baseUrl || 'Google Studio Native'}
                    </span>
                    <span>•</span>
                    <span>Key: {p.apiKey.slice(0, 6)}...{p.apiKey.slice(-4)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {p.timeoutMs || 15000}ms
                    </span>
                  </div>
                </div>
              </div>

              {/* دکمه‌های کنترل */}
              <div className="flex items-center gap-2 self-end md:self-center">
                <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl gap-0.5">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMovePriority(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-teal-400 disabled:opacity-20 cursor-pointer"
                    title="افزایش اولویت (یک پله بالاتر)"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === providers.length - 1}
                    onClick={() => handleMovePriority(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-teal-400 disabled:opacity-20 cursor-pointer"
                    title="کاهش اولویت (یک پله پایین‌تر)"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleToggleActive(p.id)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${p.isActive ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60' : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                  title={p.isActive ? 'غیرفعال‌سازی موقت' : 'فعال‌سازی'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-teal-400 rounded-xl transition-colors cursor-pointer"
                  title="ویرایش پیکربندی"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 bg-rose-950/60 border border-rose-900 text-rose-400 hover:bg-rose-900/60 rounded-xl transition-colors cursor-pointer"
                  title="حذف کامل"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مدال افزودن / ویرایش مدل */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-black text-white">
                {editingId ? 'ویرایش ارائه‌دهنده هوش مصنوعی' : 'افزودن مدل جدید به ابتدای صف'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-2">تکمیل سریع با الگوهای آماده:</span>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-teal-300 rounded-xl text-[10px] font-bold transition-all text-right truncate cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-3.5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">نام نمایشی:</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثلاً: OpenRouter Qwen Free"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">نوع پروتکل:</label>
                  <select
                    value={formData.providerType}
                    onChange={e => setFormData({ ...formData, providerType: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-bold focus:outline-none focus:border-teal-500"
                  >
                    <option value="openai_compatible">OpenAI-Compatible (OpenRouter, ZenMux, DeepSeek)</option>
                    <option value="gemini_native">Google Gemini Native SDK</option>
                  </select>
                </div>
              </div>

              {formData.providerType === 'openai_compatible' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">آدرس Base URL:</label>
                  <input
                    type="text"
                    required
                    value={formData.baseUrl || ''}
                    onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://openrouter.ai/api/v1"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:outline-none focus:border-teal-500"
                    dir="ltr"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">شناسه مدل (Model ID):</label>
                  <input
                    type="text"
                    required
                    value={formData.model || ''}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    placeholder="qwen/qwen-2.5-72b-instruct:free"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:outline-none focus:border-teal-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">حداکثر زمان انتظار (ms):</label>
                  <input
                    type="number"
                    value={formData.timeoutMs || 15000}
                    onChange={e => setFormData({ ...formData, timeoutMs: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  کلید اختصاصی API Key:
                </label>
                
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    required
                    value={formData.apiKey || ''}
                    onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full text-xs p-2.5 pr-10 rounded-xl border border-slate-800 bg-slate-950 text-white font-mono focus:outline-none focus:border-teal-500"
                    dir="ltr"
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {showApiKey ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره و قرارگیری در اولویت ۱'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
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