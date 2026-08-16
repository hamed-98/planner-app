'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect } from 'react';
import LandingPage from '../components/LandingPage';
import { createClient } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [landingConfig, setLandingConfig] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    
    // Check Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      }
    );

    // Fetch Global Settings
    (supabase.from('global_settings').select('value').eq('id', 'landing_page').single() as any).then(({ data }: any) => {
      if (data && data.value) {
        setLandingConfig(data.value);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleEnterApp = () => {
    if (!isLoggedIn) {
      router.push('/auth');
    } else {
      router.push('/dashboard');
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <LandingPage onEnterApp={handleEnterApp} isLoggedIn={isLoggedIn} landingConfig={landingConfig} />
  );
}
