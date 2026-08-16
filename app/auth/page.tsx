'use client';

import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone,
          }
        }
      });
      if (error) {
        setMessage(error.message);
      } else {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sayeban_')) localStorage.removeItem(key);
        }
        if (data.session) {
          router.push('/');
        } else {
          setMessage('ثبت‌نام با موفقیت انجام شد! لطفاً ایمیل خود را تایید کنید یا وارد شوید.');
          setIsSignUp(false); // Switch to sign in just in case email confirm is disabled but session wasn't returned
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMessage('ایمیل یا رمز عبور اشتباه است.');
      else {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sayeban_')) localStorage.removeItem(key);
        }
        router.push('/'); // Redirect to dashboard
      }
    }
  };

  const handleOAuth = async (provider: 'google') => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sayeban_')) localStorage.removeItem(key);
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage('Please enter your email to reset password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    if (error) setMessage(error.message);
    else setMessage('Password reset instructions sent to your email.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
          {isSignUp ? 'ایجاد حساب کاربری' : 'به سایبان خوش آمدید'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4" dir="rtl">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">شماره تماس (اختیاری)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 text-left"
                  dir="ltr"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ایمیل</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 text-left"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رمز عبور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50 text-left"
              dir="ltr"
              required
            />
          </div>
          
          <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all">
            {isSignUp ? 'ثبت‌نام' : 'ورود'}
          </button>
        </form>
        
        {message && (
          <p className="mt-4 text-sm text-center text-rose-600 bg-rose-50 p-2 rounded-lg" dir="rtl">{message}</p>
        )}
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">یا ورود با</span>
            </div>
          </div>
          
          <button
            onClick={() => handleOAuth('google')}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium text-slate-700"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
        </div>
        
        <div className="mt-8 flex flex-col space-y-2 text-center text-sm" dir="rtl">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-teal-600 hover:underline">
            {isSignUp ? 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید' : "حساب کاربری ندارید؟ ثبت‌نام کنید"}
          </button>
          {!isSignUp && (
            <button onClick={handleResetPassword} className="text-slate-500 hover:text-slate-700 hover:underline">
              رمز عبور خود را فراموش کرده‌اید؟
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
