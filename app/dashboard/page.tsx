'use client';

import React, { useEffect, useState } from 'react';
import Dashboard from '../../components/Dashboard';
import { useSession, signOut } from '../../lib/auth-client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // تضمین اجرای منطق کلاینتی پس از هایدریشن کامل
  useEffect(() => {
    setMounted(true);
  }, []);

  // ذخیره آخرین نام کاربر در حافظه محلی جهت استفاده در حالت آفلاین
  useEffect(() => {
    if (session?.user?.name) {
      localStorage.setItem('sayeban_last_user_name', session.user.name);
    } else if (session?.user?.email) {
      localStorage.setItem('sayeban_last_user_name', session.user.email.split('@')[0]);
    }
  }, [session]);

  useEffect(() => {
    if (mounted && !isPending && !session) {
      // در صورت قطع اینترنت کاربر به لاگین هدایت نمی‌شود تا با دیتای لوکال کار کند
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      router.push('/login');
    }
  }, [session, isPending, router, mounted]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith('sayeban_') ||
          key.startsWith('water_xp_') ||
          key.startsWith('mood_xp_')
        ) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.removeItem('sayeban_active_tab');
    }

    await signOut();
    window.location.href = '/login';
  };

  const cachedName =
    typeof window !== 'undefined'
      ? localStorage.getItem('sayeban_last_user_name')
      : null;
  const displayName =
    session?.user?.name ||
    session?.user?.email?.split('@')[0] ||
    cachedName ||
    'کاربر گرامی';

  // تا قبل از Mount شدن کامل، سرور و کلاینت دقیقاً یک اسپینر مشترک رندر می‌کنند
  if (!mounted || isPending || !session) {
    if (mounted && typeof navigator !== 'undefined' && !navigator.onLine) {
      return <Dashboard userName={displayName} onLogout={handleLogout} />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFCFC] dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <Dashboard userName={displayName} onLogout={handleLogout} />;
}