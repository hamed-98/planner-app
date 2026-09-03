'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

export type GuideTopicKey = 
  | 'memory_score' 
  | 'flexibility_score'
  | 'math_speed'
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
    subtitle: 'گنجایش نگهداری و پردازش هم‌زمان زنجیره‌های اطلاعاتی',
    icon: '🧠',
    formula: 'محاسبه بر پایه قانون ظرفیت میلر (Miller’s Span 7±2) با مقیاس ۳ تا ۹ مرحله الگوهای فضایی مستقیم و معکوس در میانگین ۲۰ تلاش معتبر اخیر.',
    description: 'حافظه کاری مانند RAM ذهن است؛ ظرفیت محدودی دارد و داده‌ها را برای استدلال، مکالمات و برنامه‌ریزی موقت زنده نگه می‌دارد.',
    scientificBenefit: 'تحریک هم‌زمان قشر پیش‌پیشانی پشت‌جانبی (dlPFC) و هیپوکامپ، که مستقیماً مانع از حواس‌پرتی و پرش فکری حین کار عمیق می‌شود.',
    howToImprove: 'تمرین چالش حافظه در حالت معکوس (Reverse Mode) برای وادار کردن مغز به دستکاری فعال الگوها.'
  },
  flexibility_score: {
    title: 'انعطاف‌پذیری شناختی استروپ (Cognitive Flexibility)',
    subtitle: 'توانایی مهار پاسخ‌های خودکار و سوئیچ سریع میان محرک‌های متناقض',
    icon: '🔀',
    formula: 'ترکیب ضربی دقت پاسخ‌ها و ضریب مهار تداخل زمانی (ΔRT = زمان ناهمخوان منهای همخوان)، همراه با فیلتر حذف پاسخ‌های تصادفی زیر ۲۵۰ میلی‌ثانیه.',
    description: 'مغز تمایل دارد متن کلمه را بخواند. وقتی کلمه «قرمز» با رنگ آبی نوشته می‌شود، کورتکس پیشانی باید پاسخ خودکار را مهار کرده و رنگ را انتخاب کند.',
    scientificBenefit: 'ارتقای کنترل مهاری (Inhibitory Control) و تقویت مهارت تصمیم‌گیری عقلانی در شرایط فشار روانی و عدم قطعیت.',
    howToImprove: 'تمرکز بر نقطه مرکزی صفحه و تمرین دیدن رنگ جوهر به جای خواندن آوای درونی کلمه.'
  },
  math_speed: {
    title: 'سرعت پردازش و محاسبات ذهنی (Processing Speed)',
    subtitle: 'توان پردازش نمادین و استنتاج منطقی در واحد زمان',
    icon: '⚡',
    formula: 'ترکیب ضربی دقت محاسباتی، حجم سوالات حل‌شده (Throughput) و زمان واکنش در واحد ثانیه، منهای جریمه پاسخ‌های غلط و تکانشی.',
    description: 'این شاخص سرعت چرخش داده‌ها در شبکه‌های نورونی کورتکس آهیانه‌ای و لوب پیشانی را بدون افت کیفیت می‌سنجد.',
    scientificBenefit: 'تراکم بیشتر غلاف میلین روی آکسون‌ها که سرعت انتقال پالس‌های عصبی را به حداکثر می‌رساند.',
    howToImprove: 'انجام روزانه حالت «کشف عملگر و مجهول» برای وادار کردن مغز به محاسبات معکوس و شکستن کلیشه‌ها.'
  },
  reaction_time: {
    title: 'میانگین زمان واکنش عصبی (Reaction Time)',
    subtitle: 'سرعت ارسال پیام از شبکیه چشم به مغز و صدور فرمان حرکتی',
    icon: '⏱️',
    formula: 'میانگین متحرک میلی‌ثانیه‌ای (ms) ثبت‌شده در پاسخ‌های معتبر ۲۰ آزمون اخیر (با پالایش نویزهای زیر ۲۵۰ms).',
    description: 'زمان واکنش نشان‌دهنده چابکی سیستم عصبی مرکزی در دریافت، تحلیل و پاسخ‌دهی به محرک‌های محیطی است.',
    scientificBenefit: 'کاهش زمان تأخیر سیناپسی و بهبود هماهنگی بین کورتکس حسی، بینایی و قشر حرکتی مغز.',
    howToImprove: 'خواب کافی شبانه (به‌ویژه مراحل عمیق N3) و حفظ هیدراتاسیون بدن، چرا که کم‌آبی زمان واکنش را تا ۱۵٪ کند می‌کند.'
  },
  accuracy_score: {
    title: 'میزان دقت شناختی (Cognitive Precision)',
    subtitle: 'نسبت پاسخ‌های درست و متمرکز به کل تلاش‌های ثبت‌شده',
    icon: '🎯',
    formula: 'میانگین وزنی درستی پاسخ‌ها در بازه ۲۰ تمرین اخیر (صحت عملکرد بدون فدا کردن کیفیت در ازای شتاب‌زدگی).',
    description: 'دقت شناختی نشان می‌دهد آیا مغز کنترل تکانه دارد یا به دام سوگیری‌های شتاب‌زده (سیستم ۱ شهودی) می‌افتد.',
    scientificBenefit: 'ایجاد توازن بین سرعت قشر حرکتی و بازبینی خطای قشر سینگولیت قدامی (ACC).',
    howToImprove: 'تنفس عمیق ۳ ثانیه‌ای قبل از شروع بازی‌ها و اولویت دادن به درستی گزینه بر سرعت خام.'
  },
  brain_index: {
    title: 'شاخص توانمندی کورتکس (Brain Index)',
    subtitle: 'تصویر جامع ۳۶۰ درجه از آمادگی نورونی و شناختی',
    icon: '👑',
    formula: 'میانگین متحرک پایدار نمرات استاندارد حافظه کاری، انعطاف استروپ و سرعت محاسبات در ۲۰ فعالیت اخیر.',
    description: 'نمره تراز عملکرد ذهنی شما؛ مستقل از غیبت‌های تقویمی، تنها با تمرین‌های جدید ارتقا یا کالیبره می‌شود.',
    scientificBenefit: 'پایش بلندمدت انعطاف‌پذیری عصبی (Neuroplasticity) و اثر سبک زندگی (خواب، آب، عادات) بر هوشیاری.',
    howToImprove: 'پیوستگی در انجام روزانه ماموریت‌های عادات، کارگاه CBT و حداقل یک دور تمرینات باشگاه.'
  },
  cbt_process: {
    title: 'کارگاه ۸ مرحله‌ای بازسازی شناختی (CBT)',
    subtitle: 'دادگاه افکار و تبدیل تحریف‌های فکری به باورهای واقع‌بینانه',
    icon: '🔮',
    formula: 'ثبت موقعیت ➔ تفکیک فکر خودکار ➔ سنجش شدت باور ➔ هیجان ➔ کشف خطای شناختی ➔ دادگاه شواهد ➔ فکر جایگزین ➔ ارزیابی مجدد.',
    description: 'درمان شناختی-رفتاری (CBT) روش استاندارد بالینی برای مهار نشخوار ذهنی، فاجعه‌سازی و استرس ناشی از تحریف‌های شناختی است.',
    scientificBenefit: 'کاهش هایپراکتیو بودن آمیگدال (مرکز ترس و اضطراب) و سپردن سکان هدایت هیجانات به کورتکس پیش‌پیشانی.',
    howToImprove: 'در لحظات هجوم اضطراب یا ناامیدی، به جای جنگیدن با افکار، مراحل دادگاه شواهد را موشکافانه تکمیل کنید.'
  },
  neuro_habits: {
    title: 'ماموریت‌های نورون‌سازی (Neurogenesis)',
    subtitle: 'ریز‌رفتارهای روزمره برای تحریک ساخت سلول‌های خاکستری جدید',
    icon: '🌱',
    formula: 'رفتارهای خارج از اتوپایلوت (مانند کار با دست غیرمسلط، نور آفتاب بامدادی و حل معما) که مغز را به سیم‌کشی مجدد وادار می‌کنند.',
    description: 'انجام کارهای تکراری به روش‌های تازه، جلوی فرسودگی نورونی را می‌گیرد و مسیرهای سیناپسی جایگزین می‌سازد.',
    scientificBenefit: 'ترشح پروتئین BDNF (فاکتور نوروتروفیک مشتق از مغز) که نقش کود مغذی را برای بقای نورون‌ها ایفا می‌کند.',
    howToImprove: 'علامت زدن مداوم حداقل ۳ ماموریت در روز و تثبیت آن‌ها در قالب عادت پایدار.'
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
          {/* هدر */}
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

          {/* فرمول */}
          <div className="bg-slate-50 dark:bg-slate-950/70 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 block uppercase tracking-wider">
              📐 فرمول و نحوه محاسبه:
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
              {guide.formula}
            </p>
          </div>

          {/* توضیحات علمی */}
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

          {/* دکمه بستن */}
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