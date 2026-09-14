'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function PwaRegister() {
  const [isOffline, setIsOffline] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // ۱. ثبت ایمن Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
        return () => window.removeEventListener('load', register);
      }
    }

    // ۲. مدیریت رویدادهای آنلاین/آفلاین
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

    // بررسی وضعیت اولیه
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

  return (
    <>
      {/* نوار اطلاع‌رسانی حالت آفلاین */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-md transition-all animate-in fade-in slide-in-from-top duration-300">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>حالت آفلاین: ارتباط با شبکه قطع است؛ شما با داده‌های ذخیره‌شده دستگاه کار می‌کنید.</span>
        </div>
      )}

      {/* اعلان اتصال مجدد به اینترنت */}
      {showOnlineToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600 text-white px-5 py-2.5 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 shadow-xl shadow-emerald-900/20 transition-all animate-in fade-in slide-in-from-bottom duration-300">
          <Wifi className="w-4 h-4 shrink-0" />
          <span>اتصال اینترنت با موفقیت برقرار شد.</span>
        </div>
      )}
    </>
  );
}
