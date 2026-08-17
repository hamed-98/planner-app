'use client';

import React, { useState } from 'react';
import { CbtRecord } from '@/lib/supabase/brainGym';
import CrisisAlertModal, { CRISIS_KEYWORDS } from './CrisisAlertModal';

export const COGNITIVE_DISTORTIONS = [
  { id: 'all_or_nothing', name: 'تفکر همه یا هیچ (All-or-Nothing)', desc: 'دیدن امور به صورت کاملاً سیاه یا سفید بدون در نظر گرفتن طیف خاکستری.' },
  { id: 'catastrophizing', name: 'فاجعه‌سازی (Catastrophizing)', desc: 'پیش‌بینی بدترین سناریوی ممکن و بزرگ‌نمایی خطرات.' },
  { id: 'mind_reading', name: 'ذهن‌خوانی (Mind Reading)', desc: 'فرض بر اینکه می‌دانید دیگران چه فکری در مورد شما می‌کنند بدون داشتن مدرک.' },
  { id: 'should_statements', name: 'جملات «باید»دار (Should Statements)', desc: 'سرزنش خود یا دیگران با انتظارات سخت‌گیرانه غیرواقعی.' },
  { id: 'personalization', name: 'شخصی‌سازی (Personalization)', desc: 'مسئول دانستن خود برای رویدادهایی که کنترل کامل روی آن‌ها ندارید.' },
  { id: 'labeling', name: 'برچسب‌زنی (Labeling)', desc: 'نسبت دادن یک صفت منفی کلی به خود یا دیگران به خاطر یک اشتباه.' },
  { id: 'negative_filtering', name: 'فیلتر منفی (Negative Filtering)', desc: 'تمرکز روی یک نقطه منفی کوچک و نادیده گرفتن تمام نکات مثبت.' },
  { id: 'fortune_telling', name: 'پیش‌گویی منفی (Fortune Telling)', desc: 'پیش‌بینی منفی آینده به عنوان یک واقعیت حتمی.' }
];

interface CbtWizardProps {
  onSaveRecord: (record: CbtRecord) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  earnXp: (amount: number, reason: string) => void;
}

export default function CbtWizard({ onSaveRecord, showToast, earnXp }: CbtWizardProps) {
  const [cbtStep, setCbtStep] = useState(1);
  const [cbtSituation, setCbtSituation] = useState('');
  const [cbtThought, setCbtThought] = useState('');
  const [cbtInitialBelief, setCbtInitialBelief] = useState(80);
  const [cbtEmotion, setCbtEmotion] = useState('اضطراب و نگرانی');
  const [cbtEmotionIntensity, setCbtEmotionIntensity] = useState(75);
  const [cbtDistortion, setCbtDistortion] = useState('catastrophizing');
  const [cbtEvidenceFor, setCbtEvidenceFor] = useState('');
  const [cbtEvidenceAgainst, setCbtEvidenceAgainst] = useState('');
  const [cbtReframed, setCbtReframed] = useState('');
  const [cbtNewBelief, setCbtNewBelief] = useState(30);

  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  const checkSafetyGuard = (text: string) => {
    const lower = text.toLowerCase();
    if (CRISIS_KEYWORDS.some(kw => lower.includes(kw))) {
      setShowCrisisAlert(true);
    }
  };

  const handleNextStep = () => {
    if (cbtStep === 1 && !cbtSituation.trim()) {
      showToast('لطفاً شرح موقعیت را وارد کنید.', 'error');
      return;
    }
    if (cbtStep === 2) {
      if (!cbtThought.trim()) {
        showToast('لطفاً فکر خودکار اولیه را وارد کنید.', 'error');
        return;
      }
      checkSafetyGuard(cbtThought);
    }
    if (cbtStep < 8) setCbtStep(prev => prev + 1);
  };

  const handleFinishCycle = async () => {
    if (!cbtReframed.trim()) {
      showToast('لطفاً فکر جایگزین منطقی را وارد کنید.', 'error');
      return;
    }

    checkSafetyGuard(cbtReframed);

    const newRecord: CbtRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cbt_' + Date.now(),
      situation: cbtSituation,
      automaticThought: cbtThought,
      initialBelief: cbtInitialBelief,
      emotion: cbtEmotion,
      emotionIntensity: cbtEmotionIntensity,
      distortion: cbtDistortion,
      evidenceFor: cbtEvidenceFor || 'مورد خاصی ثبت نشد',
      evidenceAgainst: cbtEvidenceAgainst || 'شواهد زیادی در جهت رد فکر وجود دارد',
      reframedThought: cbtReframed,
      newBelief: cbtNewBelief,
      date: new Date().toLocaleDateString('fa-IR')
    };

    await onSaveRecord(newRecord);
    earnXp(35, 'تکمیل چرخه کامل ۸ مرحله‌ای بازسازی شناختی افکار (CBT)');

    // ریست فرم
    setCbtStep(1);
    setCbtSituation('');
    setCbtThought('');
    setCbtEvidenceFor('');
    setCbtEvidenceAgainst('');
    setCbtReframed('');
  };

  return (
    <>
      <CrisisAlertModal isOpen={showCrisisAlert} onClose={() => setShowCrisisAlert(false)} />

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
              فرآیند ۸ مرحله‌ای CBT
            </span>
            <span className="text-xs font-bold text-slate-400">مرحله {cbtStep} از ۸</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">کارگاه بازسازی شناختی افکار</h3>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300"
            style={{ width: `${(cbtStep / 8) * 100}%` }}
          />
        </div>

        <div className="space-y-4">
          {cbtStep === 1 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۱: موقعیت اولیه (چه اتفاقی افتاد؟)
              </label>
              <input
                type="text"
                value={cbtSituation}
                onChange={e => setCbtSituation(e.target.value)}
                placeholder="مثلاً: در جلسه کاری مدیر از ارائه‌ام ایراد گرفت..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {cbtStep === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۲: فکر خودکار اولیه (چه فکری به ذهنت رسید؟)
              </label>
              <textarea
                rows={2}
                value={cbtThought}
                onChange={e => setCbtThought(e.target.value)}
                placeholder="مثلاً: من کلاً در کارم شکست‌خورده‌ام..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {cbtStep === 3 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۳: شدت باور به این فکر منفی
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cbtInitialBelief}
                  onChange={e => setCbtInitialBelief(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <span className="font-mono text-sm font-black text-indigo-600 dark:text-indigo-400 shrink-0">{cbtInitialBelief}٪</span>
              </div>
            </div>
          )}

          {cbtStep === 4 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۴: هیجان تجربه شده و شدت آن
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={cbtEmotion}
                  onChange={e => setCbtEmotion(e.target.value)}
                  placeholder="مثلاً: اضطراب، خشم، حس بی‌ارزشی..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">شدت:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={cbtEmotionIntensity}
                    onChange={e => setCbtEmotionIntensity(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">{cbtEmotionIntensity}٪</span>
                </div>
              </div>
            </div>
          )}

          {cbtStep === 5 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۵: شناسایی خطای شناختی
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COGNITIVE_DISTORTIONS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setCbtDistortion(d.id)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      cbtDistortion === d.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-indigo-200'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{d.name}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cbtStep === 6 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۶: دادگاه افکار (شواهد موافق و مخالف)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">شواهد موافق فکر منفی:</span>
                  <textarea
                    rows={2}
                    value={cbtEvidenceFor}
                    onChange={e => setCbtEvidenceFor(e.target.value)}
                    placeholder="دلایل درستی این فکر..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-slate-500 mb-1">شواهد مخالف (رد فکر):</span>
                  <textarea
                    rows={2}
                    value={cbtEvidenceAgainst}
                    onChange={e => setCbtEvidenceAgainst(e.target.value)}
                    placeholder="شواهد نقض این فکر مبالغه‌آمیز..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {cbtStep === 7 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۷: فکر جایگزین منطقی و واقع‌بینانه
              </label>
              <textarea
                rows={2}
                value={cbtReframed}
                onChange={e => setCbtReframed(e.target.value)}
                placeholder="مثلاً: این صرفاً یک بازخورد فنی بود و ارتباطی به کل مهارت‌های من ندارد..."
                className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>
          )}

          {cbtStep === 8 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                مرحله ۸: ارزیابی مجدد شدت باور منفی
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={cbtNewBelief}
                  onChange={e => setCbtNewBelief(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
                <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">{cbtNewBelief}٪</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            disabled={cbtStep === 1}
            onClick={() => setCbtStep(prev => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
          >
            مرحله قبل
          </button>

          {cbtStep < 8 ? (
            <button
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
            >
              مرحله بعدی
            </button>
          ) : (
            <button
              onClick={handleFinishCycle}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
            >
              ثبت نهایی چرخه CBT (+۳۵ XP)
            </button>
          )}
        </div>
      </div>
    </>
  );
}