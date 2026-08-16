'use client';

import React, { useEffect, useState } from 'react';
import { getTickets, createTicket, getTicketMessages, sendTicketMessage, updateTicketStatus, Ticket, TicketMessage } from '../lib/supabase/tickets';
import { 
  MessageSquare, 
  Plus, 
  AlertTriangle, 
  Lightbulb, 
  HelpCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  ArrowLeft, 
  ChevronRight,
  Sparkles,
  Info,
  Copy,
  Check,
  AlertOctagon
} from 'lucide-react';

interface SupportTabViewProps {
  useJalaliCalendar: boolean;
  onTicketsUpdate?: (hasUnread: boolean) => void;
}

export default function SupportTabView({ useJalaliCalendar, onTicketsUpdate }: SupportTabViewProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaError, setSchemaError] = useState(false);
  
  // New ticket form states
  const [showNewForm, setShowNewForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<'bug' | 'suggestion' | 'question' | 'other'>('bug');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  
  // Selected ticket chat states
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    fetchUserTickets();
  }, []);

  async function fetchUserTickets() {
    setLoading(true);
    try {
      const data = await getTickets(false);
      if (data === null) {
        setSchemaError(true);
      } else {
        setTickets(data);
        setSchemaError(false);
        if (onTicketsUpdate) {
          onTicketsUpdate(data.some(x => x.status === 'resolved'));
        }
      }
    } catch (err) {
      console.error(err);
      setSchemaError(true);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Auto refresh messages every 8 seconds for nice real-time feel
      const interval = setInterval(() => {
        fetchMessages(selectedTicket.id);
      }, 8000);
      
      return () => clearInterval(interval);
    }
  }, [selectedTicket]);

  async function fetchMessages(ticketId: string) {
    const msgs = await getTicketMessages(ticketId);
    setMessages(msgs);
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    setSubmitting(true);
    const created = await createTicket({
      title: formTitle.trim(),
      description: formDescription.trim(),
      category: formCategory,
      priority: formPriority
    });

    if (created) {
      setFormTitle('');
      setFormDescription('');
      setShowNewForm(false);
      await fetchUserTickets();
    }
    setSubmitting(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    const sent = await sendTicketMessage(selectedTicket.id, newMessage.trim(), false);
    if (sent) {
      setNewMessage('');
      await fetchMessages(selectedTicket.id);
    }
    setSendingMessage(false);
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    if (ticket.status === 'resolved') {
      const updated = await updateTicketStatus(ticket.id, 'in_progress');
      if (updated) {
        const updatedList = tickets.map(t => t.id === ticket.id ? { ...t, status: 'in_progress' as const } : t);
        setTickets(updatedList);
        if (onTicketsUpdate) {
          onTicketsUpdate(updatedList.some(x => x.status === 'resolved'));
        }
      }
    }
  };

  const copySqlToClipboard = () => {
    const sql = `-- کدهای زیر را کپی کرده و در بخش SQL Editor در پنل سوپابیس خود اجرا کنید.

create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null,
  status text default 'open' not null,
  priority text default 'medium' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

create policy "users can view their own tickets" on public.tickets for select using (auth.uid() = user_id);
create policy "users can insert their own tickets" on public.tickets for insert with check (auth.uid() = user_id);
create policy "users can update their own tickets" on public.tickets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins can view all tickets" on public.tickets for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin'));
create policy "admins can update any ticket" on public.tickets for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin'));

create policy "users can view messages of their own tickets" on public.ticket_messages for select using (exists (select 1 from public.tickets where tickets.id = ticket_messages.ticket_id and tickets.user_id = auth.uid()) or exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin'));
create policy "users can insert messages into their own tickets" on public.ticket_messages for insert with check ((exists (select 1 from public.tickets where tickets.id = ticket_messages.ticket_id and tickets.user_id = auth.uid()) and sender_id = auth.uid() and is_admin = false) or exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin'));`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'bug': return { text: 'گزارش مشکل', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20', icon: AlertTriangle };
      case 'suggestion': return { text: 'پیشنهاد کاربر', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', icon: Lightbulb };
      case 'question': return { text: 'سوال عمومی', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-500/20', icon: HelpCircle };
      default: return { text: 'سایر موضوعات', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700', icon: MessageSquare };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return { text: 'ارسال شده', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' };
      case 'in_progress': return { text: 'در حال بررسی', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' };
      case 'resolved': return { text: 'پاسخ داده شده', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20' };
      case 'closed': return { text: 'بسته شده', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700' };
      default: return { text: 'نامشخص', color: 'bg-slate-100 dark:bg-slate-800' };
    }
  };

  if (schemaError) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">جداول سیستم پشتیبانی فعال نیست!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              مدیر سامانه هنوز کدهای SQL مربوط به سیستم تیکت و گزارشات را در سوپابیس اجرا نکرده است. برای استفاده از این بخش، باید جداول <code className="text-rose-500 font-mono bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">tickets</code> و <code className="text-rose-500 font-mono bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded">ticket_messages</code> ایجاد شوند.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 text-right space-y-4 max-w-xl mx-auto">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">راهنمای راه‌اندازی (مخصوص مدیر):</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              کدهای زیر را کپی کرده، در پنل سوپابیس و در بخش SQL Editor قرار داده و دکمه Run را بزنید. سپس این صفحه را مجدداً بارگذاری کنید.
            </p>
            <div className="flex justify-end pt-1">
              <button 
                onClick={copySqlToClipboard}
                className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-teal-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'کدها کپی شدند!' : 'کپی کدهای راه‌اندازی SQL'}</span>
              </button>
            </div>
          </div>

          <button 
            onClick={fetchUserTickets}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-teal-500/10"
          >
            تلاش مجدد جهت بارگذاری
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {selectedTicket ? (
        // Ticket Chat View for users
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setSelectedTicket(null); fetchUserTickets(); }}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{selectedTicket.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">مشاهده و گفتگو پیرامون تیکت</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Conversation list */}
            <div className="lg:col-span-3 flex flex-col h-[520px] bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {/* Ticket description card */}
              <div className="p-5 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-150 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getCategoryLabel(selectedTicket.category).color}`}>
                      {getCategoryLabel(selectedTicket.category).text}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`}>
                      اولویت {selectedTicket.priority === 'high' ? 'فوری' : selectedTicket.priority === 'medium' ? 'متوسط' : 'کم'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">ثبت شده در: {new Date(selectedTicket.created_at).toLocaleDateString('fa-IR')}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-100/40 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-150/20">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Chat replies list */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/10 dark:bg-slate-950/10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-2">
                    <MessageSquare className="w-8 h-8" />
                    <p className="text-xs font-semibold">در انتظار پاسخ و بررسی کارشناسان پشتیبانی سایه‌بان...</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[80%] ${msg.is_admin ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                    >
                      <span className="text-[9px] text-slate-400 mb-1 px-1">{msg.is_admin ? 'پشتیبان سایه‌بان' : 'من'}</span>
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.is_admin 
                          ? 'bg-gradient-to-br from-teal-500/5 to-teal-500/10 dark:from-teal-500/10 dark:to-teal-500/5 text-slate-800 dark:text-teal-300 border border-teal-500/20 rounded-tr-none' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-tl-none'
                      }`}>
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Send reply form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 dark:border-slate-800 flex gap-2.5 bg-slate-50/20 dark:bg-slate-950/20">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پاسخی به این تیکت اضافه کنید..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 placeholder-slate-400"
                  disabled={sendingMessage}
                />
                <button 
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال</span>
                </button>
              </form>
            </div>

            {/* Quick Status Info Sidebar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm h-fit">
              <h3 className="text-xs font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">وضعیت فعلی پرونده</h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">وضعیت تیکت:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(selectedTicket.status).color}`}>
                    {getStatusBadge(selectedTicket.status).text}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400">تاریخ ایجاد:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {new Date(selectedTicket.created_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400">آخرین بروزرسانی:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {new Date(selectedTicket.updated_at).toLocaleDateString('fa-IR')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <Info className="w-4 h-4 text-teal-500 mb-1.5" />
                در صورت پاسخ به تیکت توسط ادمین، آخرین پیام‌ها را در این صفحه به شکل گفتگو مشاهده و بررسی خواهید کرد.
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tickets Dashboard (Tickets list & new form)
        <div className="space-y-6">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">سامانه تیکت، گزارش مشکل و پیشنهاد سایه‌بان</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">مشکلات خود را گزارش کنید یا پیشنهادات طلایی خود را برای بهبود کورتکس سایه‌بان ارسال کنید.</p>
            </div>

            <button 
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-white dark:text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/10"
            >
              {showNewForm ? (
                <span>نمایش تاریخچه تیکت‌ها</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>ثبت گزارش مشکل یا پیشنهاد جدید</span>
                </>
              )}
            </button>
          </header>

          {showNewForm ? (
            // Form to create a new ticket
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4 max-w-2xl">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-500" />
                <span>ارسال تیکت / گزارش / پیشنهاد جدید</span>
              </h3>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div className="space-y-2">
                  <label className="text-slate-600 dark:text-slate-300 font-bold block">موضوع یا عنوان خلاصه:</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="مثال: مشکل در باز شدن پلنر صوتی یا ایده افزودن ویجت آب"
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-slate-600 dark:text-slate-300 font-bold block">نوع ارسال (دسته‌بندی):</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
                    >
                      <option value="bug">🐛 گزارش مشکل و خطا (Bug)</option>
                      <option value="suggestion">💡 پیشنهاد جدید و ایده (Suggestion)</option>
                      <option value="question">❓ سوال عمومی یا ابهام (Question)</option>
                      <option value="other">💬 سایر موارد (Other)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-600 dark:text-slate-300 font-bold block">اولویت بررسی:</label>
                    <select 
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as any)}
                      className="w-full px-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer font-medium"
                    >
                      <option value="low">کم اهمیت (برای پیشنهادها)</option>
                      <option value="medium">متوسط (روال عادی)</option>
                      <option value="high">فوری و حیاتی (برای خرابی سیستم)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-600 dark:text-slate-300 font-bold block">شرح کامل گزارش یا پیشنهاد شما:</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    required
                    rows={5}
                    placeholder="لطفاً جزییات کامل تیکت خود را در این بخش تشریح بفرمایید..."
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl font-bold transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white dark:text-slate-950 font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-teal-500/10"
                  >
                    {submitting ? 'در حال ثبت پرونده...' : 'ثبت نهایی تیکت'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // List of existing user tickets
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">در حال دریافت تاریخچه تیکت‌های شما...</div>
              ) : tickets.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-12 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">هیچ تیکت یا پیشنهادی ندارید!</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                      اگر با خطایی روبرو شدید یا ایده‌ای برای ارتقاء سایه‌بان دارید، با دکمه بالا اولین تیکت خود را ثبت کنید.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {tickets.map((ticket) => {
                    const CatIcon = getCategoryLabel(ticket.category).icon;
                    return (
                      <div 
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-teal-500/30 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 cursor-pointer"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${getCategoryLabel(ticket.category).color}`}>
                              <CatIcon className="w-3 h-3" />
                              <span>{getCategoryLabel(ticket.category).text}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              ticket.priority === 'high' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              اولویت {ticket.priority === 'high' ? 'فوری' : ticket.priority === 'medium' ? 'متوسط' : 'کم'}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 flex items-center gap-2">
                            <span>{ticket.title}</span>
                            {ticket.status === 'resolved' && (
                              <span className="inline-flex items-center gap-1 bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                                <span className="w-1 h-1 bg-white rounded-full" />
                                پاسخ جدید
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-450 line-clamp-1">{ticket.description}</p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-50 dark:border-slate-800/40 pt-3 sm:pt-0">
                          <div className="text-right sm:text-left">
                            <span className="text-[10px] text-slate-400 block">بروزرسانی</span>
                            <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">{new Date(ticket.updated_at).toLocaleDateString('fa-IR')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(ticket.status).color}`}>
                              {getStatusBadge(ticket.status).text}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300 rotate-180 hidden sm:block" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
