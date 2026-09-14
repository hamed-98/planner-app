'use client';

import React, { useEffect } from 'react';
import Dashboard from '../../components/Dashboard';
import { useSession, signOut } from '../../lib/auth-client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
  // پاکسازی کامل کش‌های لوکال برای جلوگیری از نشت داده به اکانت بعدی
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

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFCFC] dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayName = session.user.name || session.user.email?.split('@')[0] || 'کاربر گرامی';

  return (
    <Dashboard userName={displayName} onLogout={handleLogout} />
  );
}