'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  BookOpen, 
  CheckSquare, 
  Activity, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  User, 
  BookMarked, 
  Tag, 
  Hash, 
  Search,
  Globe,
  Sun,
  Moon,
  X,
  Share2,
  Heart,
  Bookmark,
  ChevronRight,
  Clock
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  isLoggedIn?: boolean;
  landingConfig?: {
    hero_bg?: string;
    logo?: string;
    encyclopedia_posts?: any[];
  };
}

// Mock Blog Data resembling SSG SEO articles
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  slug: string;
  content: string;
  imageUrl?: string;
}

const blogs: BlogPost[] = [
  {
    id: "1",
    title: "چگونه با تکنیک مسدودسازی زمانی (Time Blocking) بهره‌وری خود را دوبرابر کنیم؟",
    excerpt: "مسدودسازی زمانی یکی از مؤثرترین روش‌ها برای سازماندهی روز و جلوگیری از حواس‌پرتی است. در این مقاله به چگونگی ادغام آن با تقویم سایبان می‌پردازیم.",
    category: "بهره‌وری",
    tags: ["تمرکز", "مدیریت زمان", "آموزش"],
    date: "۱۴۰۵/۰۳/۲۵",
    readTime: "۵ دقیقه",
    slug: "time-blocking-guide",
    content: `### تکنیک مسدودسازی زمانی (Time Blocking) چیست؟

مسدودسازی زمانی یکی از قدرتمندترین متدهای مدیریت زمان در دنیاست که توسط افراد موفقی همچون ایلان ماسک و کال نیوپورت استفاده می‌شود. در این روش، شما به جای نوشتن یک لیست بی‌پایان از کارها، روز خود را به بلوک‌های زمانی مشخص تقسیم می‌کنید و به هر بلوک، وظیفه خاصی را اختصاص می‌دهید.

#### چرا لیست کارهای سنتی کارایی ندارد؟
لیست کارهای ساده معمولاً فاقد فاکتور «زمان» هستند. وقتی زمان انجام کارها مشخص نباشد، مغز تمایل دارد کارهای ساده‌تر را انتخاب کند و کارهای عمیق و مهم‌تر را به تعویق بیندازد. مسدودسازی زمانی این مشکل را با مجبور کردن شما به برنامه‌ریزی دقیق حل می‌کند.

#### مراحل پیاده‌سازی مسدودسازی زمانی با سایبان:
۱. **شناسایی اولویت‌های روزانه:** قبل از شروع روز، ۳ کار اصلی خود را مشخص کنید.
۲. **تخصیص بلوک‌های زمانی:** در تقویم سایبان، برای هر کار یک بازه زمانی مشخص (مثلا ۹:۰۰ تا ۱۰:۳۰ برای کار عمیق) ایجاد کنید.
۳. **بلوک‌های واکنش‌گرایانه:** زمان‌هایی را برای پاسخ به ایمیل‌ها، پیام‌ها و کارهای پیش‌بینی نشده در نظر بگیرید تا برنامه اصلی شما بهم نخورد.
۴. **تمرکز مطلق:** در حین اجرای هر بلوک، تمامی اعلان‌ها را خاموش کرده و از پخش‌کننده موسیقی ذن سایبان برای تمرکز بیشتر استفاده کنید.

با رعایت این اصول ساده، تمرکز ذهنی شما افزایش یافته و بهره‌وری روزانه‌تان به شکل چشمگیری ارتقا می‌یابد.`,
    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop"
  },
  {
    id: "2",
    title: "تاثیر پایش منظم مصرف آب و خواب بر تمرکز ذهنی برنامه‌نویسان و طراحان",
    excerpt: "کم‌آبی بدن و خواب نامنظم تأثیر مخرب مستقیمی روی کورتکس پیش‌پیشانی دارد. یاد بگیرید چگونه با ردیاب سلامت سایبان عادات بیولوژیک خود را بهینه‌سازی کنید.",
    category: "پایگاه سلامت",
    tags: ["سلامت", "تغذیه", "سبک زندگی"],
    date: "۱۴۰۵/۰۳/۲۰",
    readTime: "۷ دقیقه",
    slug: "hydration-and-sleep-focus",
    content: `### رابطه بین بیولوژی و بهره‌وری ذهنی

عملکرد کورتکس پیش‌پیشانی مغز (ناحیه‌ای که مسئول تصمیم‌گیری، تمرکز عمیق و حل مسئله است) به شدت به وضعیت هیدراتاسیون و خواب شما وابسته است. کاهش حتی ۲ درصد از آب بدن می‌تواند باعث کاهش ۲۰ درصدی سرعت پردازش شناختی مغز شود!

#### تاثیر کم‌آبی بر عملکرد کورتکس پیش‌پیشانی:
زمانی که آب کافی به مغز نمی‌رسد، حجم سلول‌های مغزی کاهش یافته و انتقال‌دهنده‌های عصبی با کندی مواجه می‌شوند. این امر منجر به ایجاد مه مغزی (Brain Fog)، خستگی زودرس و کاهش صبر در حل مسائل پیچیده می‌شود.

#### چرا پایش خواب اهمیت دارد؟
خواب عمیق (Deep Sleep) مرحله‌ای است که مغز اقدام به سم‌زدایی و یکپارچه‌سازی حافظه می‌کند. خواب ناکافی مانع از پاک‌سازی پروتئین‌های سمی مغز شده و تمرکز روز بعد را به شدت تضعیف می‌کند.

#### روش بهینه‌سازی بیولوژیک با سایبان:
* **پایش هوشمند آب:** برای خود هدف حداقل ۸ لیوان آب در روز تنظیم کرده و با هر لیوان، آن را در بخش سلامت سایبان ثبت کنید.
* **تنظیم ساعت خواب منظم:** خواب بین ۷ تا ۸ ساعت با کیفیت بالا را هدف قرار داده و کیفیت آن را هر روز ارزیابی کنید.
* **تحلیل روندها:** در پایان هفته، نمودارهای همبستگی بین مصرف آب، میزان خواب و خلق‌وخوی روزانه خود را بررسی کنید تا الگوی بهینه خود را بیابید.`,
    imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "3",
    title: "عادت‌سازی پیشرو: چطور زنجیره عادات روزانه (Habit Streaks) مغز را پاداش می‌دهد؟",
    excerpt: "سیستم دوپامین مغز عاشق تکمیل زنجیره‌های متوالی است. بررسی علمی نقش گیمیفیکیشن و زنجیره‌ها در تغییر رفتار بلندمدت خانواده و کارآفرینان.",
    category: "روانشناسی",
    tags: ["عادت‌ها", "گیمیفیکیشن", "انگیزه"],
    date: "۱۴۰۵/۰۳/۱۵",
    readTime: "۴ دقیقه",
    slug: "science-of-habit-streaks",
    content: `### علم پشت زنجیره عادات (Habit Streaks)

چرخه عادت در مغز شامل سه مرحله است: محرک، رفتار، و پاداش. زمانی که شما یک رفتار مثبت (مثل ورزش یا مطالعه) را انجام می‌دهید و آن را ثبت می‌کنید، مغز دوز کوچکی از انتقال‌دهنده عصبی دوپامین را ترشح می‌کند که حس رضایت‌مندی به همراه دارد.

#### قدرت زنجیره‌ها:
هنگامی که چندین روز متوالی یک کار را انجام می‌دهید، یک «زنجیره متوالی» شکل می‌گیرد. در این مرحله، انگیزه شما از «تمایل به انجام کار» به «ترس از شکستن زنجیره» تغییر می‌یابد. مغز شما تمایل شدیدی دارد تا این تسلسل بصری را حفظ کند.

#### چگونه عادات پایدار بسازیم؟
۱. **عادات را به بخش‌های بسیار کوچک تقسیم کنید:** به جای «۱ ساعت ورزش روزانه»، با «۱۰ دقیقه نرمش» شروع کنید.
۲. **بلافاصله ثبت کنید:** پس از انجام عادت، فوراً دکمه تکمیل را در بخش عادات سایبان بزنید تا پیوند عصبی بین رفتار و پاداش تقویت شود.
۳. **هرگز دو روز متوالی را از دست ندهید:** شکستن زنجیره برای یک روز طبیعی است، اما اگر دو روز متوالی تکرار شود، به معنای شروع یک عادت بد جدید است.

با استفاده از ابزار پایش عادات سایبان و کسب امتیاز تجربه (XP) برای هر موفقیت، مسیر عادت‌سازی خود را به یک بازی جذاب و علمی تبدیل کنید.`,
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop"
  }
];

const faqs = [
  {
    q: "آیا سایبان کاملا آفلاین کار می‌کند؟",
    a: "بله، سایبان از بانک اطلاعاتی بهینه‌شده مرورگر شما سود می‌برد. تمامی داده‌ها، یادداشت‌ها و کارنامه‌ها بدون نیاز به اینترنت به صورت محلی ذخیره شده و پس از برقراری ارتباط با فناوری Push مجدداً همگام‌سازی می‌شوند."
  },
  {
    q: "دستیار صوتی کارهای من را چطور تحلیل می‌کند؟",
    a: "ما از مدل هوش مصنوعی فوق‌پیشرفته Gemini شرکت گوگل کمک گرفته‌ایم. مدل قادر است جملات محاوره‌ای فارسی یا انگلیسی شما نظیر «فردا ۵ عصر کلاس دارم» را فهمیده و مستقیما آن را به رویداد تقویم یا وظیفه در کسری از ثانیه تبدیل کند."
  },
  {
    q: "قیمت‌گذاری نسخه‌های مختلف چگونه است؟",
    a: "نسخه پایه سایبان با امکانات اصلی کاملاً رایگان است. برای دسترسی به هوش مصنوعی نامحدود، همگام‌سازی ابری و تحلیل‌های چندجانبه پیشرفته می‌توانید اشتراک حرفه‌ای تهیه کنید."
  },
  {
    q: "چگونه می‌توانم از داده‌های خود خروجی بگیرم؟",
    a: "در بخش تنظیمات، امکان استخراج کامل و یکجای اطلاعات شما با استانداردهای متن‌باز نظیر JSON و CSV وجود دارد تا حق مالکیت تام بر اطلاعات خود داشته باشید."
  }
];

export default function LandingPage({ onEnterApp, isLoggedIn, landingConfig }: LandingPageProps) {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [blogFilter, setBlogFilter] = useState<{ category?: string; tag?: string }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [lang, setLang] = useState<'fa' | 'en'>('fa');
  
  // Encyclopedia details states
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDarkTheme = currentTheme === 'dark';

  // Dynamic blogs based on supabase settings or standard fallback
  const activeBlogs = (landingConfig?.encyclopedia_posts && landingConfig.encyclopedia_posts.length > 0)
    ? landingConfig.encyclopedia_posts
    : blogs;

  // Filtered Blog articles based on selections
  const filteredBlogs = activeBlogs.filter(post => {
    if (blogFilter.category && post.category !== blogFilter.category) return false;
    if (blogFilter.tag && !post.tags.includes(blogFilter.tag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q);
    }
    return true;
  });

  const allCategories = Array.from(new Set(activeBlogs.map(b => b.category)));
  const allTags = Array.from(new Set(activeBlogs.flatMap(b => b.tags)));

    const handleLaunch = () => {
    onEnterApp();
  };

  return (
    <div id="landing-container" className={`min-h-screen ${isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50/40 text-slate-800'} transition-colors duration-300 font-sans`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
      
      {/* Navigation Header */}
      <header id="main-header" className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {landingConfig?.logo ? (
              <img src={landingConfig.logo} alt="Sayeban" className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
            )}
            <span className="text-xl font-black bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              {lang === 'fa' ? 'سـایـبـان' : 'Sayeban'}
            </span>
            <div className="hidden md:flex ml-8 mr-8 items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <a href="#features" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {lang === 'fa' ? 'قابلیت‌ها' : 'Features'}
              </a>
              <a href="#blog" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {lang === 'fa' ? 'مجله سلامت و بهره‌وری' : 'SEO Mag'}
              </a>
              <a href="#pricing" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {lang === 'fa' ? 'قیمت‌گذاری' : 'Pricing'}
              </a>
              <a href="#faq" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                {lang === 'fa' ? 'سوالات متداول' : 'FAQ'}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              id="theme-toggle"
              type="button"
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-pointer"
              onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
              title="تغییر پوسته"
            >
              {mounted && isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Toggle */}
            <button 
              id="lang-toggle"
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 cursor-pointer hover:border-teal-400"
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'fa' ? 'English' : 'فارسی'}</span>
            </button>

            <button
              id="btn-login-header"
              type="button"
              onClick={handleLaunch}
              className="px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            >
              {isLoggedIn ? (lang === 'fa' ? 'داشبورد شما' : 'Your Dashboard') : (lang === 'fa' ? 'عضویت / ورود' : 'Sign Up / Login')}
            </button>

            {isLoggedIn ? null : (
              <button 
                id="btn-go-header"
                type="button"
                onClick={handleLaunch}
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-md shadow-teal-600/10 cursor-pointer"
              >
                {lang === 'fa' ? 'شروع رایگان' : 'Start Free'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="relative pt-16 pb-24 overflow-hidden">
        {/* Full-Bleed Background Image */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0">
          <img 
            src={landingConfig?.hero_bg } 
            className="w-full h-full object-cover opacity-[0.88] dark:opacity-[0.95] scale-105 transition-all duration-[20s]" 
            alt="Hero Background Map" 
          />
          {/* Gradients to blend/mask the image with the theme background */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-slate-950/40 dark:to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40 dark:from-slate-950/40 dark:via-transparent dark:to-slate-950/40" />
        </div>

        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-900/50 mb-6 text-xs sm:text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{lang === 'fa' ? 'مجهز به دستیار هوشمند مدل هوش مصنوعی گوگل Gemini' : 'Powered by Google Gemini AI 3.5'}</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl font-black text-slate-950 dark:text-white leading-tight tracking-tight mb-6"
            >
              {lang === 'fa' ? (
                <>
                  زندگی هوشمند را در یک قاب <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-400 bg-clip-text text-transparent">سایبان</span> مدیریت کنید
                </>
              ) : (
                <>
                  Manage your life under a single <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">Sayeban</span>
                </>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10 px-4"
            >
              {lang === 'fa' ? 
                'ترکیب هماهنگ برنامه‌ریزی دورتصادمی، چک‌نویس پیشرفته، بورد مدیریت کارهای کایزن و پایشگر شاخص‌های حیاتی و خواب به همراه منشی هوش مصنوعی همه‌فن‌حریف.'
                : 'A beautifully automated PWA space unifying calendars, Markdown notes, Kanban tasks, body and mind trackers, powered by conversational NLP AI.'
              }
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
            >
              <button 
                id="btn-launch-hero"
                type="button"
                onClick={handleLaunch}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/25 dark:shadow-teal-500/10 hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2 text-base"
              >
                <span>{lang === 'fa' ? 'ورود به پیشخوان کاربری' : 'Launch Dashboard'}</span>
                {lang === 'fa' ? <ArrowLeft className="w-5 h-5 rtl-flip" /> : <ArrowRight className="w-5 h-5" />}
              </button>

              <a 
                href="#features"
                className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-800 dark:text-slate-200 font-semibold rounded-2xl transition-all border border-slate-200/50 dark:border-slate-700 text-center text-base"
              >
                {lang === 'fa' ? 'مشاهده ماژول‌ها' : 'Explore Modules'}
              </a>
            </motion.div>
          </div>


          {/* Interactive Feature Mockup Grid Demo */}
          <div id="demo-mockup" className="max-w-5xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 sm:p-4 shadow-2xl relative shadow-teal-500/5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 px-3">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-400" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-400" />
              </div>
              <div className="text-xs bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
                https://sayeban.ai/dashboard
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Left Panel Event Demo */}
              <div className="bg-slate-55 bg-indigo-50/20 dark:bg-slate-850/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-teal-600 mb-3 font-semibold text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{lang === 'fa' ? 'پلنر تقویم هوشمند' : 'Intelligent Planner'}</span>
                </div>
                <div className="space-y-2.5">
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-150/50 dark:border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">08:30 - 09:30</span>
                    <h5 className="font-semibold text-xs mt-1 text-slate-800 dark:text-slate-200">{lang === 'fa' ? 'جلسه هماهنگی محصول با تیم فنی' : 'Scrum Alignment Meeting'}</h5>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-xl border border-teal-100/50 dark:border-teal-900/40">
                    <span className="text-xs text-teal-600 font-mono">17:00 - 18:30</span>
                    <h5 className="font-semibold text-xs mt-1 text-teal-850 dark:text-teal-305">{lang === 'fa' ? 'تمرین هوازی قلبی و ثبت سلامت' : 'Cardio and Health Sync'}</h5>
                  </div>
                </div>
              </div>

              {/* Middle Panel AI Chat Demo */}
              <div className="bg-teal-50/20 dark:bg-slate-850/30 p-4 rounded-2xl border border-teal-500/10 md:col-span-1">
                <div className="flex items-center gap-2 text-emerald-600 mb-3 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>{lang === 'fa' ? 'دستیار فهم زبان سایبان' : 'Gemini AI Advisor'}</span>
                </div>
                <div className="space-y-2.5">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl text-[11px] leading-relaxed border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {lang === 'fa' ? 'کاربر: فردا ساعت ۵ عصر جلسه کاری دارم' : 'User: I have a meeting at 5 PM tomorrow'}
                  </div>
                  <div className="bg-teal-600 text-white p-3 rounded-xl text-[11px] leading-relaxed shadow-sm">
                    {lang === 'fa' ? 'به رویدادهای تقویم فردا ساعت ۱۷:۰۰ با موفقیت ثبت شد.' : 'Analyzed NLP: Added "Work Meeting" to calendar for June 17, 17:00.'}
                  </div>
                </div>
              </div>

              {/* Right Panel Health Status Tracker */}
              <div className="bg-emerald-50/20 dark:bg-slate-850/30 p-4 rounded-2xl border border-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-600 mb-3 font-semibold text-sm">
                  <Activity className="w-4 h-4" />
                  <span>{lang === 'fa' ? 'وضعیت شاخص‌های تندرستی' : 'Holistic Health'}</span>
                </div>
                <div className="space-y-2 font-mono">
                  <div className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded-xl">
                    <span className="text-slate-500">{lang === 'fa' ? 'مصرف آب امروز' : 'Hydration Log'}</span>
                    <span className="font-semibold text-teal-500">1200 / 2500 ML</span>
                  </div>
                  <div className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded-xl">
                    <span className="text-slate-500">{lang === 'fa' ? 'کیفیت خواب راحت' : 'Sleep Quality'}</span>
                    <span className="font-semibold text-emerald-500">۸۵٪ (۷.۵ ساعت)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 px-3 py-2 rounded-xl">
                    <span className="text-slate-500">{lang === 'fa' ? 'طول عادات جاری' : 'Current Habits'}</span>
                    <span className="font-semibold text-pink-500">🔥 ۵ روز متوالی</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Showcase Feature Cards */}
      <section id="features" className="py-24 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mb-4">
              {lang === 'fa' ? 'طراحی شده بر اساس علم انگیزه و روانشناختی' : 'Designed for True Cognitive Peace'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              {lang === 'fa' ? 'مجموعه‌ای یکپارچه از ابزارهای هوش‌محور بدون نیاز به ورود چندباره اطلاعات در قالب‌ها و ابزارهای گوناگون.'
                : 'Say goodbye to fragmented tools. Manage every single day, draft, note, and health parameter in a beautifully synced layout.'}
            </p>
          </div>

          <div id="features-bento-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150/40 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-slate-950/20 hover:scale-[1.01] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-950 dark:text-white">
                {lang === 'fa' ? '۱. تقویم و پلنر روزانه' : '1. Responsive Planner'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-350 leading-relaxed">
                {lang === 'fa' ? 'پشتیبانی یکجا از تقویم جلالی (شمسی) و میلادی. ایجاد یادداشت، بلوک‌بندی زمانی دقیق مواعد و تکرار رویدادها.'
                  : 'Double layouts for Persian Jalali & English calendars. Setup recurrent plans, quick drag schedules, and time boxing.'}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150/40 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-slate-950/20 hover:scale-[1.01] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-950 dark:text-white">
                {lang === 'fa' ? '۲. یادداشت‌ حرفه‌ای غنی' : '2. Rich Notes Editor'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-350 leading-relaxed">
                {lang === 'fa' ? 'ادیتور غنی با پشتیبانی عالی از فرمت‌های Markdown، پوشه‌بندی درختی، پین کردن اسناد و ضمیمه کردن فایل‌ها.'
                  : 'Tree folders, tag catalogs, and markdown blocks. Highlight quotes, lists, tables, and persist them securely offline.'}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150/40 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-slate-950/20 hover:scale-[1.01] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-950 dark:text-white">
                {lang === 'fa' ? '۳. مدیریت کارها و کانبان' : '3. Kanban Tasks'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-350 leading-relaxed">
                {lang === 'fa' ? 'تغییر همزمان نما از لیست‌ها به بردهای چابک کانبان (Kanban). پیگیری اولویت‌ها، زیرکارها و تکرار خودکار.'
                  : 'Switch seamlessly between neat checklists and agile Kanban columns. Create prioritizations, subtasks, and repeat alerts.'}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-150/40 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-slate-950/20 hover:scale-[1.01] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-950 dark:text-white">
                {lang === 'fa' ? '۴. خانه پایش سلامت' : '4. Health Dashboard'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-350 leading-relaxed">
                {lang === 'fa' ? 'ثبت هیدراتاسیون، کیفیت خواب، آمار ورزش، ردیاب توده چربی، نمودار خلق‌وخوی روزانه و تقویم منظم داروها.'
                  : 'Log water intake goals, sleep ratios, physical fitness, automatically calculated BMI scales, medications and streak habits.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO SSG Blog Section */}
      <section id="blog" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-bold tracking-wider uppercase mb-2">
                <BookMarked className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'مطالب آموزشی و علمی کورتکس' : 'Sayeban Content Center'}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-950 dark:text-white">
                {lang === 'fa' ? 'دانشنامه ارتقای سلامت و بهره‌وری' : 'SEO Resources & Well-Being articles'}
              </h2>
            </div>

            {/* Mini Search & filter reset button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  id="blog-search"
                  type="text"
                  placeholder={lang === 'fa' ? "جستجو در مجله..." : "Search articles..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:outline-none focus:ring-1 focus:ring-teal-500 w-48 text-slate-800 dark:text-slate-100"
                />
              </div>

              {(blogFilter.category || blogFilter.tag || searchQuery) && (
                <button 
                  id="reset-blog-filter"
                  type="button"
                  onClick={() => { setBlogFilter({}); setSearchQuery(""); }}
                  className="px-3 py-2 text-xs text-rose-500 border border-rose-200 dark:border-rose-900 rounded-lg bg-rose-50/20 hover:bg-rose-50/50 cursor-pointer"
                >
                  {lang === 'fa' ? 'پاک‌سازی فیلتر' : 'Clear Filter'}
                </button>
              )}
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap items-center gap-2 mb-8 p-4 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {lang === 'fa' ? 'فیلتر بر اساس تگ:' : 'Search Tag:'}
            </span>
            {allTags.map(t => (
              <button 
                key={t}
                onClick={() => setBlogFilter({ tag: t })}
                className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition-all ${blogFilter.tag === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'}`}
              >
                #{t}
              </button>
            ))}
            
            <div className="w-full h-[1px] bg-slate-200/50 dark:bg-slate-800 my-2" />
            
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {lang === 'fa' ? 'همه‌ دسته‌ها:' : 'Categories:'}
            </span>
            {allCategories.map(c => (
              <button 
                key={c}
                onClick={() => setBlogFilter({ category: c })}
                className={`px-2.5 py-1 text-xs rounded-lg border cursor-pointer transition-all ${blogFilter.category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Blog Articles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBlogs.map((post) => (
                <motion.article 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  key={post.id}
                  className="bg-white dark:bg-slate-900 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 rounded-3xl overflow-hidden border border-slate-150/40 dark:border-slate-800 flex flex-col justify-between group"
                >
                  <div className="flex flex-col">
                    {/* Blog Cover Image */}
                    {post.imageUrl ? (
                      <div className="h-48 w-full overflow-hidden relative border-b border-slate-100 dark:border-slate-800">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
                      </div>
                    ) : (
                      <div className="h-48 w-full bg-gradient-to-br from-teal-900/10 via-slate-900/10 to-indigo-900/10 flex items-center justify-center relative border-b border-slate-100 dark:border-slate-800">
                        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-indigo-500/5" />
                      </div>
                    )}

                    <div className="p-6 pb-0">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span className="bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300 font-semibold">
                          {post.category}
                        </span>
                        <span>{post.date}</span>
                      </div>
                      <h4 
                        onClick={() => setSelectedArticle(post)}
                        className="text-md font-bold text-slate-950 dark:text-white mb-2 cursor-pointer hover:text-teal-600 dark:hover:text-teal-400 leading-relaxed line-clamp-2 transition-colors"
                      >
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-350 leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>
                  
                  <div className="p-6 pt-0">
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {post.tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] font-mono text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/40 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-405 font-mono">
                        {lang === 'fa' ? `زمان مطالعه: ${post.readTime}` : `${post.readTime} read`}
                      </span>
                      <button 
                        id={`btn-read-${post.id}`}
                        type="button"
                        onClick={() => setSelectedArticle(post)}
                        className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{lang === 'fa' ? 'مطالعه کامل' : 'Read Article'}</span>
                        <ArrowLeft className="w-3.5 h-3.5 rtl-flip" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
            
            {filteredBlogs.length === 0 && (
              <div className="col-span-1 md:col-span-3 text-center py-12">
                <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  {lang === 'fa' ? 'هیچ مقاله‌ای با معیارهای فیلتر شما یافت نشد.' : 'No blog articles map this tag criteria.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Comparison Module */}
      <section id="pricing" className="py-24 border-t border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              {lang === 'fa' ? 'تعرفه‌های اشتراک هوشمند' : 'Subscription Plans'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mt-4 mb-4">
              {lang === 'fa' ? 'پلن مناسب کارهای خود را برگزینید' : 'Choose Your Zen Mode'}
            </h2>
            
            {/* Annual billing toggle */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className={`text-sm ${!isAnnual ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400'}`}>
                {lang === 'fa' ? 'پرداخت ماهانه' : 'Monthly'}
              </span>
              <button 
                id="billing-cycle-toggle"
                type="button" 
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-800 p-1 flex items-center transition-all cursor-pointer"
              >
                <div className={`w-4 h-4 rounded-full bg-teal-600 transition-all ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm ${isAnnual ? 'text-slate-800 dark:text-slate-200 font-bold' : 'text-slate-400'}`}>
                {lang === 'fa' ? 'پرداخت سالانه (۲۰٪ تخفیف ویژه)' : 'Annually (Save 20%)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 relative shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-500 mb-2">{lang === 'fa' ? 'نسخه پایه (آفلاین)' : 'Zen Base'}</h4>
                <div className="flex items-baseline gap-1.5 my-4">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">0</span>
                  <span className="text-slate-400 text-sm">/ {lang === 'fa' ? 'همیشگی' : 'Lifetime'}</span>
                </div>
                <p className="text-sm text-slate-550 mb-8 leading-relaxed">
                  {lang === 'fa' ? 'عالی برای تک‌کاربرها که می‌خواهند داده‌های خود را محلی نگهداری کنند.' : 'Perfect for local privacy advocates.'}
                </p>
                
                <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">{lang === 'fa' ? 'امکانات موجود:' : 'Includes:'}</h5>
                <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-350">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'دفتر یادداشت متداول محلی' : 'Standard Web notes'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'تقویم با پشتیبانی از کارهای امروز' : 'Today and Month Calendar'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'ردیاب آب مصرفی و خواب پایه‌ای' : 'Basic water & habits logs'}</span>
                  </li>
                </ul>
              </div>
              
              <button 
                id="btn-select-free"
                type="button"
                onClick={handleLaunch}
                className="w-full py-3.5 mt-8 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
              >
                {lang === 'fa' ? 'عضویت رایگان' : 'Get Started'}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-teal-500 relative shadow-xl flex flex-col justify-between">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[10px] font-bold px-4.5 py-1 rounded-full uppercase tracking-wider">
                {lang === 'fa' ? 'محبوب‌ترین اشتراک' : 'Most Popular'}
              </span>
              <div>
                <h4 className="text-lg font-bold text-teal-600 mb-2">{lang === 'fa' ? 'نسخه توسعه‌دهنده Pro' : 'Sayeban Professional'}</h4>
                <div className="flex items-baseline gap-1.5 my-4">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {isAnnual ? '۲۹۹,۰۰۰' : '۳۶۰,۰۰۰'}
                  </span>
                  <span className="text-slate-400 text-sm">{lang === 'fa' ? 'تومان / ماهانه' : 'Toman / mo'}</span>
                </div>
                <p className="text-sm text-slate-550 mb-8 leading-relaxed">
                  {lang === 'fa' ? 'دسترسی کامل و نامحدود به موتور هوش معنوی Gemini با پایش دقیق تمام متغیرها.' : 'Unlock the ultimate intelligent experience.'}
                </p>
                
                <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">{lang === 'fa' ? 'همه امکانات پایه به علاوه:' : 'Everything in Base, plus:'}</h5>
                <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-350">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold">{lang === 'fa' ? 'دستیار کامل صوتی/متنی Gemini' : 'Unlimited Gemini Flash AI usage'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'فهم زبان طبیعی برای خلق رویداد/کار' : 'NLP speech interpretation actions'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'پارت‌ال امروزی و داشبورد آستین‌بالا' : 'Cross-device Cloud Sync & PWA link'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'کارنامه‌های آمار سلامت چندبعدی تعاملی' : 'BMI charts + weight goals history'}</span>
                  </li>
                </ul>
              </div>
              
              <button 
                id="btn-select-pro"
                type="button"
                onClick={handleLaunch}
                className="w-full py-3.5 mt-8 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
              >
                {lang === 'fa' ? 'عضویت و آغاز اشتراک پرو' : 'Get Professional Now'}
              </button>
            </div>

            {/* Team Plan */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 relative shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-500 mb-2">{lang === 'fa' ? 'نسخه تیمی و خانواده' : 'Team / Family Shield'}</h4>
                <div className="flex items-baseline gap-1.5 my-4">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {isAnnual ? '۴۹۹,۰۰۰' : '۵۹۰,۰۰۰'}
                  </span>
                  <span className="text-slate-400 text-sm">{lang === 'fa' ? 'تومان / ماهانه' : 'Toman / mo'}</span>
                </div>
                <p className="text-sm text-slate-550 mb-8 leading-relaxed">
                  {lang === 'fa' ? 'برای تیم‌های کاری یا خانواده‌هایی که برای اهداف تیمی برنامه‌ریزی می‌کنند.' : 'For collaborative workspace alignments.'}
                </p>
                
                <h5 className="font-bold text-xs uppercase text-slate-400 tracking-wider mb-4">{lang === 'fa' ? 'همه امکانات پرو به علاوه:' : 'Everything in Pro, plus:'}</h5>
                <ul className="space-y-3.5 text-sm text-slate-600 dark:text-slate-350">
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'تعریف تا حداکثر ۵ عضو خانواده' : 'Support up to 5 family team members'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'تقویم مشترک خانواده و کارآفرینان' : 'Shared team workspace calendars'}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{lang === 'fa' ? 'پشتیبان‌گیری رمزنگاری شده چندگانه' : 'Encrypted remote backups'}</span>
                  </li>
                </ul>
              </div>
              
              <button 
                id="btn-select-team"
                type="button"
                onClick={handleLaunch}
                className="w-full py-3.5 mt-8 border border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all cursor-pointer"
              >
                {lang === 'fa' ? 'ایجاد گره همکاری تیمی' : 'Start Free Trial'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* User Comments / Testimonials Accent Banner */}
      <section id="testimonials" className="py-20 bg-white dark:bg-slate-900 border-t border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {lang === 'fa' ? 'بیش از ۱۰,۰۰۰ کاربر بهره‌ور به ما اعتماد دارند' : 'Loved by 10k+ Calm Achievers'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-normal italic mb-4">
                {lang === 'fa' ? '«من به شدت درگیر حواس‌پرتی روی بستر ابزارهای زیاد بودم. تجمیع برنامه‌ها با خواب و آب به مغزم یاد داده است که زندگی سالم پیوسته است.»' : '"Finding a notes app and physical body tracker that speaks with Gemini was a dream come true."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                  M
                </div>
                <div>
                  <h6 className="font-bold text-xs text-slate-800 dark:text-slate-100">{lang === 'fa' ? 'مرتضی ملکیان' : 'Morteza'}</h6>
                  <span className="text-[10px] text-slate-400">{lang === 'fa' ? 'طراح ارشد رابط کاربری' : 'Lead Designer'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-normal italic mb-4">
                {lang === 'fa' ? '«قابلیت ثبت کارها از طریق ویس در برنامه‌ریزی شلوغ‌ترین کارهام غوغا می‌کنه. سایبان حالا دستیار دست‌راست منه.»' : '"The voice speech processing parsing is mind blowing. It translates naturally into scheduled events instantly."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                  S
                </div>
                <div>
                  <h6 className="font-bold text-xs text-slate-800 dark:text-slate-100">{lang === 'fa' ? 'سروش صدر' : 'Soroush'}</h6>
                  <span className="text-[10px] text-slate-400">{lang === 'fa' ? 'بنیان‌گذار مکاترونیک ایران' : 'Founder, TechLabs'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-normal italic mb-4">
                {lang === 'fa' ? '«سادگی بصری و رنگ‌های کدر مناسب چشم من است. تقویم شمسی آن با رابط کش کارآمد است.»' : '"RTL direction is smooth. Visuals focus heavily on typography and eye-safety."'}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                  A
                </div>
                <div>
                  <h6 className="font-bold text-xs text-slate-800 dark:text-slate-100">{lang === 'fa' ? 'آتنا کریمی' : 'Athena'}</h6>
                  <span className="text-[10px] text-slate-400">{lang === 'fa' ? 'پژوهشگر سلامت روان' : 'Mental Health Lead'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ Page Panel */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-center mb-10 text-slate-950 dark:text-white">
          {lang === 'fa' ? 'پاسخ به سوالات متفکران و کاربران' : 'Frequently Asked Questions'}
        </h3>
        
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-slate-900 border border-slate-150/40 dark:border-slate-800 rounded-2xl overflow-hidden transition-all"
            >
              <button 
                id={`accordion-btn-${i}`}
                type="button"
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full flex justify-between items-center p-5 text-right font-bold text-slate-800 dark:text-slate-205 focus:outline-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/50"
              >
                <span className="text-base">{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transform transition-transform duration-300 ${activeFaq === i ? 'rotate-180' : 'rotate-0'}`} />
              </button>
              
              <AnimatePresence initial={false}>
                {activeFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <div className="p-5 text-sm text-slate-500 dark:text-slate-350 leading-relaxed bg-slate-50/30 dark:bg-slate-850/20">
                      {f.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Structured Footer */}
      <footer id="main-footer" className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400 mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-white text-base font-black mb-2">{lang === 'fa' ? 'پلتفرم متمرکز سایبان' : 'Sayeban Life Sync'}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'fa' ? 'تجمیع آگاهانه اهداف، متون و خواب، بدون نشت اطلاعات شخصی شما در موتورهای متفرقه تبلیغاتی.' : 'An elegant local-first productivity workspace respecting your ultimate data privacy.'}
            </p>
          </div>
          <div>
            <h5 className="text-white font-bold mb-3">{lang === 'fa' ? 'دپارتمان‌ها' : 'Dapartments'}</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">{lang === 'fa' ? 'طرح‌ها و عملکردها' : 'Features Hub'}</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">{lang === 'fa' ? 'جفت‌جور مالی' : 'Flexible plans'}</a></li>
              <li><a href="#blog" className="hover:text-white transition-colors">{lang === 'fa' ? 'بلاگ عمومی کورتکس' : 'Health Mag'}</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-3">{lang === 'fa' ? 'حقوقی و صیانت' : 'Legal & Privacy'}</h5>
            <ul className="space-y-2 text-xs">
              <li>{lang === 'fa' ? 'حفاظت مالکی داده‌ها' : 'Data Ownership Guarantee'}</li>
              <li>{lang === 'fa' ? 'قرارداد محرمانگی بالا' : 'No Sell Policy'}</li>
              <li>{lang === 'fa' ? 'سیاست کوکی کاربر' : 'Cookie Settings'}</li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-3">{lang === 'fa' ? 'تماس با ما' : 'Contact Support'}</h5>
            <p className="text-xs text-slate-500 leading-normal mb-2">
              anna.mayer.rub@gmail.com
            </p>
            <p className="text-xs text-slate-500">
              {lang === 'fa' ? 'ایران، تهران، دانشگاه شریف، شتاب‌دهنده فناوری صعود' : 'AI Studio preview, London, Cloud Run'}
            </p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {lang === 'fa' ? '۱۴۰۵ سایبان. تمامی حقوق مادی و معنوی محفوظ است.' : '2026 Sayeban. Developed on Google AI Studio.'}</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <span>{lang === 'fa' ? 'نسخه ۲.۵ (فارسی)' : 'Version 2.5'}</span>
            <span>Made with ❤ by Antigravity Agent</span>
          </div>
        </div>
      </footer>

      {/* Encyclopedia Article Details Premium Slide-Over Overlay */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
            dir={lang === 'fa' ? 'rtl' : 'ltr'}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative border border-slate-100 dark:border-slate-800"
            >
              {/* Dynamic Reading Progress Bar */}
              <div 
                className="absolute top-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-500 transition-all duration-75 z-50"
                style={{ width: `${readingProgress}%` }}
              />

              {/* Reader Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedArticle(null);
                      setReadingProgress(0);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    title={lang === 'fa' ? 'بستن' : 'Close'}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="text-xs bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full font-bold border border-teal-100 dark:border-teal-900/40">
                    {selectedArticle.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {selectedArticle.date}
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lang === 'fa' ? `زمان مطالعه: ${selectedArticle.readTime}` : `${selectedArticle.readTime} read`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-teal-500 flex items-center gap-1.5 text-xs font-bold"
                    title={lang === 'fa' ? 'کپی لینک مقاله' : 'Copy link'}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{copiedLink ? (lang === 'fa' ? 'کپی شد!' : 'Copied!') : (lang === 'fa' ? 'اشتراک‌گذاری' : 'Share')}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Article Body */}
              <div 
                onScroll={(e) => {
                  const target = e.currentTarget;
                  const scrollPercent = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
                  setReadingProgress(scrollPercent);
                }}
                className="flex-1 overflow-y-auto p-6 sm:p-10 scrollbar-thin space-y-8"
              >
                {/* Article Image Cover */}
                {selectedArticle.imageUrl ? (
                  <div className="w-full h-64 sm:h-96 rounded-2xl overflow-hidden relative shadow-lg">
                    <img 
                      src={selectedArticle.imageUrl} 
                      alt={selectedArticle.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-teal-900/20 via-slate-900/20 to-indigo-900/20 flex items-center justify-center relative">
                    <BookOpen className="w-12 h-12 text-teal-500" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-indigo-500/10" />
                  </div>
                )}

                {/* Article Header */}
                <div className="space-y-4 max-w-3xl mx-auto">
                  <h1 className="text-2xl sm:text-3.5xl font-black text-slate-950 dark:text-white leading-tight tracking-tight">
                    {selectedArticle.title}
                  </h1>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-400 sm:hidden">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedArticle.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedArticle.readTime}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold border-r-4 border-teal-500 pr-4 italic">
                    {selectedArticle.excerpt}
                  </p>
                </div>

                {/* Main Text Content */}
                <article className="max-w-3xl mx-auto text-slate-800 dark:text-slate-300 space-y-4">
                  {selectedArticle.content ? (
                    selectedArticle.content.split('\n').map((line, i) => {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('###')) {
                        return <h3 key={i} className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white mt-8 mb-4">{trimmed.replace('###', '').trim()}</h3>;
                      }
                      if (trimmed.startsWith('####')) {
                        return <h4 key={i} className="text-md sm:text-lg font-bold text-slate-950 dark:text-white mt-6 mb-3">{trimmed.replace('####', '').trim()}</h4>;
                      }
                      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                        return <li key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mr-4 list-disc mb-2">{trimmed.substring(1).trim()}</li>;
                      }
                      if (/^\d+\./.test(trimmed)) {
                        return <li key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mr-4 list-decimal mb-2">{trimmed.replace(/^\d+\./, '').trim()}</li>;
                      }
                      if (!trimmed) {
                        return <div key={i} className="h-2" />;
                      }
                      return <p key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-loose mb-4 text-justify font-sans">{trimmed}</p>;
                    })
                  ) : (
                    <p className="text-sm text-slate-500">محتوای این مقاله هنوز بارگذاری نشده است.</p>
                  )}
                </article>

                {/* Article Footer & Tags */}
                <div className="max-w-3xl mx-auto pt-6 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap gap-2 mb-8">
                    {selectedArticle.tags.map((tag: string) => (
                      <span key={tag} className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Recommendations panel */}
                  {activeBlogs.filter((b: any) => b.id !== selectedArticle.id && b.category === selectedArticle.category).length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-850/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 mt-8">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <BookMarked className="w-4 h-4 text-teal-500" />
                        {lang === 'fa' ? 'مقالات مرتبط پیشنهادی' : 'Suggested Reads'}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeBlogs
                          .filter((b: any) => b.id !== selectedArticle.id && b.category === selectedArticle.category)
                          .slice(0, 2)
                          .map((rec: any) => (
                            <div 
                              key={rec.id}
                              onClick={() => {
                                setSelectedArticle(rec);
                                setReadingProgress(0);
                              }}
                              className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer hover:border-teal-400 dark:hover:border-teal-400 transition-colors flex items-center gap-3"
                            >
                              {rec.imageUrl ? (
                                <img src={rec.imageUrl} alt={rec.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-500 flex-shrink-0">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                              )}
                              <div className="space-y-1 overflow-hidden">
                                <h5 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{rec.title}</h5>
                                <p className="text-[9px] text-slate-500">{rec.readTime}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
