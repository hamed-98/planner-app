'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share2, PlusSquare, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // اگر کاربر قبلاً بنر را بسته باشد تا ۳ روز نمایش ندهیم
    const dismissedUntil = localStorage.getItem('sayeban_pwa_dismissed');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // بررسی اینکه آیا از قبل به عنوان PWA نصب و اجرا شده است یا خیر
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // تشخیص دستگاه‌های iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !/crios/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // برای iOS بعد از چند ثانیه به صورت خودکار نشان دهیم
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    // شنود رویداد قبل از نصب استاندارد مرورگر (Chrome, Edge, Samsung Internet)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    // ۳ روز نمایش نده
    localStorage.setItem('sayeban_pwa_dismissed', (Date.now() + 3 * 24 * 60 * 60 * 1000).toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* بنر شناور پایین صفحه */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9998] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-teal-500/30 rounded-2xl p-4 shadow-2xl shadow-teal-900/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-900/10 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>نصب اپلیکیشن سایه‌بان</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              دسترسی سریع‌تر، روان‌تر و آفلاین
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>نصب</span>
          </button>
          <button
            onClick={handleDismiss}
            aria-label="بستن"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* مودال راهنمای نصب در آیفون/آیپد */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
              نصب سایه‌بان در iOS
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              جهت نصب وب‌اپلیکیشن روی صفحه اصلی آیفون یا آیپد:
            </p>

            <div className="space-y-3 text-right text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold text-[11px]">
                  ۱
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  در نوار پایین سافاری روی دکمه <Share2 className="w-4 h-4 text-teal-600 shrink-0" /> (Share) بزنید.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold text-[11px]">
                  ۲
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                  منو را اسکرول کرده و <PlusSquare className="w-4 h-4 text-teal-600 shrink-0" /> «Add to Home Screen» را لمس کنید.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold text-[11px]">
                  ۳
                </span>
                <span className="text-slate-700 dark:text-slate-200">
                  در بالای صفحه گزینه «Add» را بزنید.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-all cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
}
