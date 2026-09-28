'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // فقط برای تست موقت true کنید و بعد برگردونید false
     const FORCE_SW_IN_DEV = true; 
    //  const FORCE_SW_IN_DEV = false; 

    // ۱. در محیط توسعه (dev)، سرویس‌ورکر را کلاً پاک کن تا مانع تغییرات لحظه‌ای نشود
    if (process.env.NODE_ENV === 'development' && !FORCE_SW_IN_DEV) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        caches.keys().then((keys) => {
          keys.forEach((key) => caches.delete(key));
        });
      }
      return;
    }

    // ۲. در محیط پروداکشن: ثبت سرویس‌ورکر و مدیریت به‌روزرسانی خودکار
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');

          // بررسی دوره‌ای برای وجود نسخه جدید در پس‌زمینه
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // نسخه جدید آماده شد؛ دستور به اسکیپ ویتینگ و فعال‌سازی فوری
                  installingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              };
            }
          };
        } catch (error) {
          console.error('[PWA] Registration failed:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }

      // گوش به زنگ فعال شدن ورکر جدید: رفرش خودکار صفحه برای کاربر بدون هیچ دخالت دستی
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // ۳. وضعیت آنلاین/آفلاین
    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineToast(false);
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // تنظیم خودکار متغیر ارتفاع برای حذف اسکرول‌بار صفحه
  useEffect(() => {
    if (isOffline) {
      document.documentElement.style.setProperty('--pwa-banner-h', '40px');
    } else {
      document.documentElement.style.setProperty('--pwa-banner-h', '0px');
    }
    return () => {
      document.documentElement.style.setProperty('--pwa-banner-h', '0px');
    };
  }, [isOffline]);

  return (
    <>
      
      {/* نوار حالت آفلاین با ارتفاع مقید و بدون ایجاد اسکرول‌بار */}
      {isOffline && (
        <div className="relative z-[9999] w-full h-10 bg-amber-500 text-white px-4 text-xs md:text-sm font-bold flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2 mx-auto">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
            <span>حالت آفلاین: ارتباط با شبکه قطع است؛ تغییرات روی حافظه دستگاه ذخیره می‌شود.</span>
          </div>
          <button
            onClick={() => {
              setIsOffline(false);
              document.documentElement.style.setProperty('--pwa-banner-h', '0px');
            }}
            aria-label="بستن هشدار"
            className="p-1 hover:bg-amber-600/60 rounded-lg transition-colors cursor-pointer text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* اعلان اتصال مجدد اینترنت */}
      {showOnlineToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 shadow-xl shadow-emerald-900/20 transition-all animate-in fade-in slide-in-from-bottom duration-300">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>اتصال اینترنت با موفقیت برقرار شد.</span>
        </div>
      )}
    </>
  );
}