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
    // پاکسازی کش‌های لوکال
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sayeban_')) {
        localStorage.removeItem(key);
      }
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