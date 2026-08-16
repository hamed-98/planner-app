'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import Dashboard from '../../components/Dashboard';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Check Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUserName(session.user.user_metadata?.name || session.user.email || "کاربر گرامی");
      } else {
        router.push('/auth');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
          setUserName(session.user.user_metadata?.name || session.user.email || "کاربر گرامی");
        } else {
          router.push('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const handleLogout = async () => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sayeban_')) {
        localStorage.removeItem(key);
      }
    }
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!isMounted || !isLoggedIn) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <Dashboard userName={userName} onLogout={handleLogout} />
  );
}
