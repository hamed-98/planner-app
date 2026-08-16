'use client';

import { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setMessage('Please enter a new password.');
      return;
    }
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Password updated successfully. Redirecting...');
      setTimeout(() => router.push('/'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
          Update Password
        </h2>
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 bg-slate-50"
              required
            />
          </div>
          
          <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all">
            Update Password
          </button>
        </form>
        
        {message && (
          <p className="mt-4 text-sm text-center text-teal-700 bg-teal-50 p-2 rounded-lg">{message}</p>
        )}
      </div>
    </div>
  );
}
