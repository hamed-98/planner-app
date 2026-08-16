'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import { LayoutDashboard, Users, Settings, Database, LogOut, ShieldAlert, Sparkles, Activity, Globe, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single() as any;
      
      if (profile?.role === 'superadmin') {
        setIsAuthorized(true);
      } else {
        router.push('/dashboard');
      }
    };
    
    checkAdmin();
  }, [router, supabase]);

  if (isAuthorized === null) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const menuItems = [
    { name: 'داشبورد', path: '/admin', icon: LayoutDashboard },
    { name: 'مدیریت کاربران', path: '/admin/users', icon: Users },
    { name: 'تیکت‌ها و گزارشات', path: '/admin/tickets', icon: MessageSquare },
    { name: 'مدیریت محتوا', path: '/admin/content', icon: Globe },
    { name: 'امنیت و لاگ‌ها', path: '/admin/logs', icon: ShieldAlert },
    { name: 'تنظیمات سامانه', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-400 flex items-center justify-center text-white shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">پنل مدیریت</h2>
            <p className="text-[10px] text-slate-400">دسترسی سوپر ادمین</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer ${isActive ? 'bg-rose-500/10 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>بازگشت به اپلیکیشن</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
