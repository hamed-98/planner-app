'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { Users, Activity, Target, ArrowUpRight, Activity as ActivityIcon, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTasks: 0,
    totalNotes: 0
  });
  const [signupsData, setSignupsData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch Total Users
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }) as any;
      
      // Fetch Total Tasks
      const { count: totalTasks } = await supabase.from('tasks').select('*', { count: 'exact', head: true }) as any;
      
      // Fetch Total Notes
      const { count: totalNotes } = await supabase.from('notes').select('*', { count: 'exact', head: true }) as any;

      // Fetch Recent Signups (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const { data: recentProfiles } = await supabase.from('profiles').select('created_at').gte('created_at', lastWeek.toISOString()) as any;

      const activeUsersCount = recentProfiles ? recentProfiles.length : 0;

      // Group signups by day
      const days = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
      const signupsMap: Record<string, number> = {};
      
      // Initialize last 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        signupsMap[days[d.getDay()]] = 0;
      }

      if (recentProfiles) {
        recentProfiles.forEach((p: any) => {
          if (p.created_at) {
            const date = new Date(p.created_at);
            const dayName = days[date.getDay()];
            if (signupsMap[dayName] !== undefined) {
              signupsMap[dayName]++;
            }
          }
        });
      }

      const formattedSignups = Object.keys(signupsMap).map(day => ({
        name: day,
        users: signupsMap[day]
      }));

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsersCount, // Users registered in the last 7 days as a proxy for active
        totalTasks: totalTasks || 0,
        totalNotes: totalNotes || 0
      });

      setSignupsData(formattedSignups);

      // Fetch recent logs
      const { data: logsData } = await supabase.from('admin_logs').select('*, profiles(*)').order('created_at', { ascending: false }).limit(5) as any;
      if (logsData) {
        setRecentLogs(logsData);
      }
    };

    fetchStats();
  }, [supabase]);

  const getLogColor = (action: string) => {
    switch (action) {
      case 'error': return 'bg-rose-500';
      case 'suspicious': return 'bg-amber-500';
      case 'login': return 'bg-teal-500';
      default: return 'bg-blue-500';
    }
  };

  const getLogMessage = (log: any) => {
    const userDisplay = log.profiles?.full_name || log.profiles?.email || 'سیستم';
    switch (log.action) {
      case 'error': return `خطا رخ داد: ${log.details?.message || 'نامشخص'}`;
      case 'login': return `کاربر ${userDisplay} وارد شد`;
      case 'suspicious': return `فعالیت مشکوک: ${log.details?.reason || 'نامشخص'}`;
      default: return `فعالیت: ${log.action} توسط ${userDisplay}`;
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white">آمار کلی سامانه</h1>
        <p className="text-sm text-slate-400 mt-1">نمای کلی از وضعیت کاربران و محتوا</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">کل کاربران</h3>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-white">{stats.totalUsers}</h2>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">کاربران جدید (هفته)</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-white">{stats.activeUsers}</h2>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">تسک‌های ایجاد شده</h3>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-white">{stats.totalTasks}</h2>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 font-medium">یادداشت‌های ثبت شده</h3>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-white">{stats.totalNotes}</h2>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6">ثبت‌نام‌های هفته اخیر</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={signupsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}} />
                <Bar dataKey="users" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-6">لاگ‌های اخیر سیستم</h3>
          <div className="space-y-4">
             {recentLogs.length === 0 ? (
               <div className="text-slate-500 text-sm">هیچ لاگی یافت نشد.</div>
             ) : (
               recentLogs.map((log) => (
                 <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-slate-800 last:border-0 last:pb-0">
                   <div className={`w-2 h-2 rounded-full mt-2 ${getLogColor(log.action)}`}></div>
                   <div>
                     <p className="text-sm text-slate-200">{getLogMessage(log)}</p>
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
