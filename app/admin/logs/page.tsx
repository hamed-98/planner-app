// app/admin/logs/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Activity, AlertTriangle, Info } from 'lucide-react';

export default function LogsManagement() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'suspicious'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLogIcon = (action: string) => {
    if (action.includes('ERROR')) return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    if (action.includes('SUSPICIOUS')) return <ShieldAlert className="w-5 h-5 text-amber-500" />;
    if (action.includes('LOGIN')) return <Activity className="w-5 h-5 text-teal-500" />;
    return <Info className="w-5 h-5 text-blue-500" />;
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'error') return log.action.includes('ERROR');
    if (filter === 'suspicious') return log.action.includes('SUSPICIOUS');
    return true;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white">امنیت و لاگ‌ها</h1>
        <p className="text-sm text-slate-400 mt-1">مشاهده رویدادهای سیستمی، خطاها و تغییرات امنیتی</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}
          >
            همه لاگ‌ها
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${filter === 'error' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}
          >
            خطاها
          </button>
          <button
            onClick={() => setFilter('suspicious')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${filter === 'suspicious' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60'}`}
          >
            فعالیت مشکوک
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm text-slate-300">
            <thead className="text-xs text-slate-400 bg-slate-950 border-b border-slate-800 uppercase">
              <tr>
                <th scope="col" className="px-6 py-4 w-16">نوع</th>
                <th scope="col" className="px-6 py-4">کاربر / منبع</th>
                <th scope="col" className="px-6 py-4">جزئیات</th>
                <th scope="col" className="px-6 py-4">زمان</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">در حال بارگذاری لاگ‌ها...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">لاگی یافت نشد.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        {getLogIcon(log.action)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {log.profiles?.email || 'سیستم'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono block w-fit max-w-md truncate" dir="ltr">
                        {JSON.stringify(log.details)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleString('fa-IR')}
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