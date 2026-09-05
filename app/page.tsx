// app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import { useSession } from '../lib/auth-client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const isLoggedIn = !!session?.user;

  useEffect(() => {
    setIsMounted(true);

    // دریافت تنظیمات لندینگ‌پیج از API داخلی
    fetch('/api/settings?id=landing_page')
      .then((res) => res.json())
      .then((data) => {
        if (data) setLandingConfig(data);
      })
      .catch((err) => console.error('Error fetching landing settings:', err));
  }, []);

  const handleEnterApp = () => {
    if (!isLoggedIn) {
      router.push('/login');
    } else {
      router.push('/dashboard');
    }
  };

  if (!isMounted || isPending) {
    return (
      <div className="min-h-screen bg-[#FAFCFC] dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LandingPage
      onEnterApp={handleEnterApp}
      isLoggedIn={isLoggedIn}
      landingConfig={landingConfig}
    />
  );
}