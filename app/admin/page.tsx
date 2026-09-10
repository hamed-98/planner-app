// app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Users, Activity, Target, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    totalNotes: 0,
  });
  const [signupsData, setSignupsData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`خطای سرور: کد وضعیت ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.signupsData) setSignupsData(data.signupsData);
        if (data.recentLogs) setRecentLogs(data.recentLogs);
      })
      .catch((err) => console.error('Error fetching admin dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  const getLogColor = (action: string) => {
    if (action.includes('ERROR')) return 'bg-rose-500';
    if (action.includes('SUSPICIOUS')) return 'bg-amber-500';
    if (action.includes('LOGIN')) return 'bg-teal-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white">آمار کلی سامانه</h1>
        <p className="text-sm text-slate-400 mt-1">نمای کلی از وضعیت کاربران، تسک‌ها و یادداشت‌های سایبان</p>
      </header>

      {/* کارتهای وضعیت ۴گانه */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">کل کاربران</h3>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white">{loading ? '...' : stats.totalUsers}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">کاربران جدید (هفته اخیر)</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white">{loading ? '...' : stats.activeUsers}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">تسک‌های ایجاد شده</h3>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white">{loading ? '...' : stats.totalTasks}</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">یادداشت‌های ثبت شده</h3>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-white">{loading ? '...' : stats.totalNotes}</h2>
        </div>
      </div>

      {/* بخش نمودار و لاگ‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6">ثبت‌نام‌های هفته اخیر</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="users" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6">رویدادهای اخیر سیستم</h3>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="text-slate-500 text-sm">{loading ? 'در حال دریافت لاگ‌ها...' : 'هیچ لاگی یافت نشد.'}</div>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getLogColor(log.action)}`} />
                  <div>
                    <p className="text-sm text-slate-200">{log.action} توسط {log.user_name}</p>
                    <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('fa-IR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}