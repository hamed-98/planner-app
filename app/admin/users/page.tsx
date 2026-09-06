// app/admin/users/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Search, Edit2, ShieldAlert } from 'lucide-react';

export default function UsersManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin?scope=users', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const togglePlan = async (userId: string, currentPlan: string) => {
    setUpdatingId(userId);
    const newPlan = currentPlan === 'pro' ? 'free' : 'pro';

    // بروزرسانی آنی در رابط کاربری (Optimistic update)
    setUsers(users.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u)));

    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, plan: newPlan }),
      });
    } catch (err) {
      console.error('Error updating plan:', err);
      fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    setUpdatingId(userId);
    const newRole = currentRole === 'superadmin' ? 'user' : 'superadmin';

    setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

    try {
      await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, role: newRole }),
      });
    } catch (err) {
      console.error('Error updating role:', err);
      fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const nameStr = (u.name || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return nameStr.includes(search) || emailStr.includes(search);
  });

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">مدیریت کاربران</h1>
          <p className="text-sm text-slate-400 mt-1">مشاهده، تغییر پلن و تعیین سطح دسترسی حساب‌های کاربری</p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="جستجوی نام یا ایمیل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-4 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 text-white placeholder-slate-500"
          />
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300">
            <thead className="text-xs text-slate-400 bg-slate-950 border-b border-slate-800 uppercase">
              <tr>
                <th scope="col" className="px-6 py-4">کاربر</th>
                <th scope="col" className="px-6 py-4">طرح (Plan)</th>
                <th scope="col" className="px-6 py-4">نقش</th>
                <th scope="col" className="px-6 py-4">تاریخ عضویت</th>
                <th scope="col" className="px-6 py-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">در حال دریافت لیست کاربران...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">کاربری یافت نشد.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                      updatingId === user.id ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white font-bold">
                          {user.name ? user.name[0] : (user.email ? user.email[0].toUpperCase() : 'U')}
                        </div>
                        <div>
                          <div className="font-bold text-white">{user.name || 'کاربر بدون نام'}</div>
                          <div className="text-xs text-slate-500 font-mono" dir="ltr">{user.email || 'بدون ایمیل'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          user.plan === 'pro'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {user.plan === 'pro' ? 'PRO' : 'رایگان'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          user.role === 'superadmin'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {user.role === 'superadmin' ? 'سوپر ادمین' : 'کاربر عادی'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : 'نامشخص'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePlan(user.id, user.plan)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="تغییر طرح (Pro/Free)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="تغییر نقش (Admin/User)"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}