'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Sparkles, BookOpen } from 'lucide-react';

export type GuideTopicKey = 
  | 'memory_score' 
  | 'flexibility_score' 
  | 'reaction_time' 
  | 'accuracy_score' 
  | 'brain_index'
  | 'cbt_process'
  | 'neuro_habits';

interface GuideContent {
  title: string;
  subtitle: string;
  icon: string;
  formula: string;
  description: string;
  scientificBenefit: string;
  howToImprove: string;
}

export const COGNITIVE_GUIDES: Record<GuideTopicKey, GuideContent> = {
  memory_score: {
    title: 'قدرت حافظه کاری (Working Memory)',
    subtitle: 'میزان گنجایش نگهداری و بازخوانی فعال اطلاعات در ذهن',
    icon: '🧠',
    formula: 'محاسبه بر اساس حداکثر طول الگوهای فضایی حفظ‌شده (مستقیم و معکوس) در سطوح مختلف چالش حافظه.',
    description: 'حافظه کاری مثل رم (RAM) کامپیوتر است؛ اطلاعات موقت را برای حل مسائل پیچیده، مکالمات روزمره و برنامه‌ریزی زنده نگه می‌دارد.',
    scientificBenefit: 'تقویت قشر پیش‌پیشانی (PFC) و هیپوکامپ که مستقیماً مانع از فراموشی لحظه‌ای و حواس‌پرتی در حین کار می‌شود.',
    howToImprove: 'تمرین مداوم با چالش حافظه فضایی (مخصوصاً در حالت معکوس 🔄) به مدت ۱۰ دقیقه در روز.'
  },
  flexibility_score: {
    title: 'انعطاف‌پذیری شناختی استروپ (Cognitive Flexibility)',
    subtitle: 'توانایی مهار پاسخ‌های خودکار و سوئیچ سریع بین مفاهیم متضاد',
    icon: '🔀',
    formula: 'محاسبه بر پایه میزان غلبه بر خطای ناهمخوانی رنگ و کلمه در آزمون استاندارد استروپ (Stroop Effect).',
    description: 'مغز عادت دارد متن کلمات را سریع‌تر از رنگ فونت بخواند. وقتی رنگ کلمه «قرمز» آبی باشد، کورتکس باید پاسخ اتوماتیک را سرکوب کند.',
    scientificBenefit: 'تقویت کنترل مهاری (Inhibitory Control) و افزایش قدرت تصمیم‌گیری منطقی در شرایط استرس و دوراهی‌ها.',
    howToImprove: 'انجام دوره‌ای آزمون استروپ در حالت «ترکیبی» و تمرکز روی رنگ جوهر به جای خواندن متن.'
  },
  reaction_time: {
    title: 'میانگین زمان واکنش عصبی (Processing Speed)',
    subtitle: 'سرعت انتقال پالس‌های عصبی از گیرنده‌های چشمی به دستور حرکتی',
    icon: '⚡',
    formula: 'میانگین متحرک میلی‌ثانیه‌ای (Moving Average) ثبت‌شده در ۲۰ تمرین اخیر شما در سامانه.',
    description: 'زمان واکنش نشان می‌دهد مغز با چه سرعتی محرک محیطی را تحلیل کرده و تصمیم اجرایی را صادر می‌کند.',
    scientificBenefit: 'بهینه‌سازی غلاف میلین نورون‌ها که سرعت انتقال سیگنال‌ها را در کورتکس تا صد برابر افزایش می‌دهد.',
    howToImprove: 'انجام تست‌های محاسبات سریع و آزمون‌های رفلکسی بدون وقفه ذهنی.'
  },
  accuracy_score: {
    title: 'میزان دقت شناختی (Cognitive Precision)',
    subtitle: 'درصد پاسخ‌های بدون خطا در کل تعاملات ذهنی',
    icon: '🎯',
    formula: 'درصد درستی پاسخ‌ها در بازه ۲۰ آزمون اخیر (تعداد صحیح تقسیم بر کل تلاش‌ها ضربدر ۱۰۰).',
    description: 'این شاخص کیفیت تصمیم‌گیری را می‌سنجد و نشان می‌دهد آیا سرعت بالا باعث افت دقت شده است یا خیر.',
    scientificBenefit: 'ایجاد تعادل بین شتاب‌زدگی سیستم ۱ مغز (شهودی) و دقت سیستم ۲ (منطقی و تحلیلی).',
    howToImprove: 'کاهش استرس قبل از شروع بازی‌ها و اولویت دادن به درستی انتخاب‌ها نسبت به شتاب‌زدگی.'
  },
  brain_index: {
    title: 'شاخص کلی قدرت مغز (Brain Index)',
    subtitle: 'شاخص جامع سلامت و توانمندی نورونی',
    icon: '👑',
    formula: 'میانگین وزنی چهار فاکتور: حافظه + انعطاف + سرعت پردازش + انرژی تمرکز (از ۱۰۰).',
    description: 'تصویر ۳۶۰ درجه از آمادگی ذهنی شما برای چالش‌های تحصیلی، شغلی و تصمیم‌گیری‌های حساس روزانه.',
    scientificBenefit: 'پایش روند تغییرات شکل‌پذیری مغز (نوروپلاستیسیته) در طول هفته‌ها و ماه‌ها.',
    howToImprove: 'حفظ پیوستگی روزانه در تمام ابعاد باشگاه (بازی‌ها، ماموریت‌های عادات و بازسازی افکار).'
  },
  cbt_process: {
    title: 'کارگاه ۸ مرحله‌ای بازسازی شناختی (CBT)',
    subtitle: 'دادگاه افکار و تبدیل تحریف‌های شناختی به باورهای واقع‌بینانه',
    icon: '🔮',
    formula: 'ثبت موقعیت ➔ تفکیک فکر خودکار ➔ سنجش شدت باور ➔ هیجان ➔ کشف خطای شناختی ➔ دادگاه شواهد ➔ فکر جایگزین ➔ ارزیابی مجدد.',
    description: 'درمان شناختی-رفتاری (CBT) اثبات‌شده‌ترین متد علمی برای غلبه بر اضطراب، نشخوار ذهنی و افکار مبالغه‌آمیز است.',
    scientificBenefit: 'کاهش فعالیت بیش‌از‌حد آمیگدال (مرکز ترس و استرس) و بازگرداندن کنترل به کورتکس پیش‌پیشانی منطقی.',
    howToImprove: 'در لحظات هجوم احساسات منفی، بلافاصله فرم دادگاه افکار را باز کرده و چرخه را کامل کنید.'
  },
  neuro_habits: {
    title: 'ماموریت‌های نورون‌سازی (Neurogenesis)',
    subtitle: 'کارهای ساده روزمره برای تحریک ساخت سلول‌های خاکستری مغز',
    icon: '🌱',
    formula: 'فعالیت‌هایی نظیر کار با دست غیرمسلط، نور خورشید اول صبح و یادگیری مفاهیم نو که مغز را از حالت اتوپایلوت خارج می‌کنند.',
    description: 'وقتی کارهای روتین را به شیوه جدید انجام می‌دهید، مغز ناچار به ایجاد شبکه‌های سیناپسی تازه می‌شود.',
    scientificBenefit: 'تحریک ترشح فاکتور نوروتروفیک مشتق از مغز (BDNF) که مانند کود شیمیایی برای رشد سلول‌های عصبی عمل می‌کند.',
    howToImprove: 'هر روز حداقل ۳ تا از ۵ ماموریت پیشنهادی را علامت بزنید.'
  }
};

interface CognitiveGuideModalProps {
  topicKey: GuideTopicKey | null;
  onClose: () => void;
}

export default function CognitiveGuideModal({ topicKey, onClose }: CognitiveGuideModalProps) {
  if (!topicKey) return null;
  const guide = COGNITIVE_GUIDES[topicKey];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          onClick={e => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-lg w-full rounded-3xl p-6 shadow-2xl text-right space-y-5"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
                {guide.icon}
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{guide.title}</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{guide.subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Formula / Calculation */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 block uppercase tracking-wider">
              📐 فرمول و نحوه محاسبه:
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
              {guide.formula}
            </p>
          </div>

          {/* Detailed explanation */}
          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">🔍 مفهوم چیست؟</span>
              <p className="text-slate-600 dark:text-slate-400">{guide.description}</p>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>فایده اثبات‌شده در علوم اعصاب:</span>
              </span>
              <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-normal">{guide.scientificBenefit}</p>
            </div>

            <div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">🚀 چطور ارتقایش دهیم؟</span>
              <p className="text-slate-600 dark:text-slate-400">{guide.howToImprove}</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          >
            متوجه شدم
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}