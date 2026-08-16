'use client';
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */

import React, { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { ShieldAlert, Activity, AlertTriangle, Info } from 'lucide-react';

export default function LogsManagement() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchLogs = async () => {
    setLoading(true);
    // In a real app we'd fetch from admin_logs table
    // Since we just defined it in SQL and might not have data yet, we mock some logs + fetch
    const { data } = await supabase.from('admin_logs').select('*, profiles(name, email)').order('created_at', { ascending: false }).limit(50) as any;
    
    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLogIcon = (action: string) => {
    switch (action) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'suspicious': return <ShieldAlert className="w-5 h-5 text-amber-500" />;
      case 'login': return <Activity className="w-5 h-5 text-teal-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-white">امنیت و لاگ‌ها</h1>
        <p className="text-sm text-slate-400 mt-1">مشاهده فعالیت‌های سیستم و خطاهای احتمالی</p>
      </header>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex gap-2">
          <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold">همه لاگ‌ها</button>
          <button className="px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm transition-colors">خطاها</button>
          <button className="px-4 py-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg text-sm transition-colors">فعالیت مشکوک</button>
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
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">در حال بارگذاری...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">لاگی یافت نشد.</td>
                </tr>
              ) : (
                logs.map((log) => (
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
                      <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono block w-fit max-w-md truncate">
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
