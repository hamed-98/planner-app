// app/login/page.tsx
'use client';

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        const res = await signUp.email({
          email,
          password,
          name,
        });
        if (res.error) {
          setErrorMsg(res.error.message || 'خطا در ثبت‌نام');
        } else {
        //   router.push('/');
        window.location.href = '/dashboard';
        }
      } else {
        const res = await signIn.email({
          email,
          password,
        });
        if (res.error) {
          setErrorMsg(res.error.message || 'ایمیل یا رمز عبور اشتباه است');
        } else {
        //   router.push('/');
        window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl text-white">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            {isRegister ? 'ایجاد حساب کاربری سایبان' : 'ورود به سایبان'}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegister ? 'مشخصات خود را برای شروع وارد کنید' : 'برای ادامه اطلاعات خود را وارد نمایید'}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً: علی رضایی"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">ایمیل</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:border-teal-500 focus:outline-none dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">رمز عبور</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۸ کاراکتر"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs focus:border-teal-500 focus:outline-none dir-ltr text-left"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'در حال ارسال...' : isRegister ? 'ثبت‌نام و ورود' : 'ورود به حساب'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-xs text-teal-400 hover:underline font-bold"
          >
            {isRegister ? 'قبلاً حساب ساخته‌اید؟ وارد شوید' : 'حساب ندارید؟ ثبت‌نام کنید'}
          </button>
        </div>
      </div>
    </div>
  );
}