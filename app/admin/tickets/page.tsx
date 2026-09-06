// app/admin/tickets/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  getTickets,
  getTicketMessages,
  sendTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
  Ticket,
  TicketMessage,
} from '@/lib/api/tickets';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
  Search,
  Send,
  ArrowLeft,
} from 'lucide-react';

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    setLoading(true);
    try {
      const data = await getTickets(true);
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  async function fetchMessages(ticketId: string) {
    const msgs = await getTicketMessages(ticketId);
    setMessages(msgs);
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    const result = await sendTicketMessage(selectedTicket.id, newMessage.trim(), true);
    if (result) {
      setNewMessage('');
      await fetchMessages(selectedTicket.id);
      if (selectedTicket.status === 'open') {
        const updated = await updateTicketStatus(selectedTicket.id, 'in_progress');
        if (updated) {
          setSelectedTicket(updated);
          setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? updated : t)));
        }
      }
    }
    setSendingMessage(false);
  };

  const handleStatusChange = async (status: Ticket['status']) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    const updated = await updateTicketStatus(selectedTicket.id, status);
    if (updated) {
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: updated.status } : t)));
    }
    setUpdatingStatus(false);
  };

  const handlePriorityChange = async (priority: Ticket['priority']) => {
    if (!selectedTicket) return;
    const updated = await updateTicketPriority(selectedTicket.id, priority);
    if (updated) {
      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, priority: updated.priority } : t)));
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'bug':
        return { text: 'گزارش مشکل', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: AlertTriangle };
      case 'suggestion':
        return { text: 'پیشنهاد', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Lightbulb };
      case 'question':
        return { text: 'سوال', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', icon: HelpCircle };
      default:
        return { text: 'سایر موضوعات', color: 'bg-slate-800 text-slate-300 border-slate-700', icon: MessageSquare };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return { text: 'باز', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
      case 'in_progress':
        return { text: 'در حال بررسی', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' };
      case 'resolved':
        return { text: 'حل شده', color: 'bg-teal-500/10 text-teal-400 border border-teal-500/20' };
      case 'closed':
        return { text: 'بسته شده', color: 'bg-slate-800 text-slate-400 border border-slate-700' };
      default:
        return { text: 'نامشخص', color: 'bg-slate-800 text-slate-300 border border-slate-700' };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return { text: 'فوری', color: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
      case 'medium':
        return { text: 'متوسط', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
      case 'low':
        return { text: 'کم اهمیت', color: 'bg-slate-800 text-slate-300' };
      default:
        return { text: 'متوسط', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.user_name && t.user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const bugCount = tickets.filter((t) => t.category === 'bug').length;

  return (
    <div className="space-y-6" dir="rtl">
      {selectedTicket ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedTicket(null)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
            <div>
              <h1 className="text-xl font-black text-white">{selectedTicket.title}</h1>
              <p className="text-xs text-slate-500 mt-1">
                ارسال‌شده توسط: <span className="text-teal-400 font-bold">{selectedTicket.user_name}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 flex flex-col h-[600px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 bg-slate-950 border-b border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getCategoryLabel(selectedTicket.category).color}`}>
                      {getCategoryLabel(selectedTicket.category).text}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityBadge(selectedTicket.priority).color}`}>
                      اولویت {getPriorityBadge(selectedTicket.priority).text}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {new Date(selectedTicket.created_at).toLocaleString('fa-IR')}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl text-sm text-slate-300 leading-relaxed border border-slate-800/40">
                  <p className="whitespace-pre-line">{selectedTicket.description}</p>
                </div>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                    <MessageSquare className="w-8 h-8" />
                    <p className="text-sm">هنوز پاسخی ثبت نشده است.</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[80%] ${msg.is_admin ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] text-slate-500">{msg.sender_name}</span>
                        <span className="text-[9px] text-slate-600">
                          {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          msg.is_admin
                            ? 'bg-gradient-to-br from-rose-500/10 to-rose-600/10 text-rose-300 border border-rose-500/20 rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پاسخ مدیریت را بنویسید..."
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-5 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال پاسخ</span>
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">اقدام و تغییر وضعیت</h3>

                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block">وضعیت تیکت:</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
                    disabled={updatingStatus}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="open">باز</option>
                    <option value="in_progress">در حال بررسی</option>
                    <option value="resolved">حل شده</option>
                    <option value="closed">بسته شده</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs text-slate-400 block">اولویت:</label>
                  <select
                    value={selectedTicket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Ticket['priority'])}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="low">کم اهمیت</option>
                    <option value="medium">متوسط</option>
                    <option value="high">فوری</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-white">مدیریت تیکت‌ها و گزارشات</h1>
              <p className="text-sm text-slate-400 mt-1">پاسخگویی به مشکلات و بازخوردهای کاربران سایبان</p>
            </div>

            <button
              onClick={fetchTickets}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer font-bold"
            >
              بروزرسانی لیست
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">کل تیکت‌ها</span>
                <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">در حال بررسی و باز</span>
                <span className="text-2xl font-black text-teal-400 mt-1 block">{openCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">حل شده</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">{resolvedCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">گزارش مشکل</span>
                <span className="text-2xl font-black text-rose-400 mt-1 block">{bugCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="جستجو در عنوان، توضیحات یا نام کاربر..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-white placeholder-slate-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">دسته‌بندی:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">همه</option>
                  <option value="bug">گزارش مشکل</option>
                  <option value="suggestion">پیشنهاد</option>
                  <option value="question">سوال</option>
                  <option value="other">سایر</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">وضعیت:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  <option value="all">همه</option>
                  <option value="open">باز</option>
                  <option value="in_progress">در حال بررسی</option>
                  <option value="resolved">حل شده</option>
                  <option value="closed">بسته شده</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm text-slate-300">
                <thead className="text-xs text-slate-400 bg-slate-950 border-b border-slate-800 uppercase">
                  <tr>
                    <th scope="col" className="px-6 py-4">کاربر</th>
                    <th scope="col" className="px-6 py-4">عنوان تیکت</th>
                    <th scope="col" className="px-6 py-4">نوع</th>
                    <th scope="col" className="px-6 py-4">اولویت</th>
                    <th scope="col" className="px-6 py-4">وضعیت</th>
                    <th scope="col" className="px-6 py-4">بروزرسانی</th>
                    <th scope="col" className="px-6 py-4">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">در حال بارگذاری تیکت‌ها...</td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">هیچ تیکتی یافت نشد.</td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const CatIcon = getCategoryLabel(ticket.category).icon;
                      return (
                        <tr key={ticket.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-200">{ticket.user_name}</td>
                          <td className="px-6 py-4 max-w-xs">
                            <div className="font-bold text-white truncate" title={ticket.title}>{ticket.title}</div>
                            <div className="text-xs text-slate-500 truncate mt-0.5" title={ticket.description}>{ticket.description}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${getCategoryLabel(ticket.category).color}`}>
                              <CatIcon className="w-3 h-3" />
                              <span>{getCategoryLabel(ticket.category).text}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(ticket.priority).color}`}>
                              {getPriorityBadge(ticket.priority).text}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(ticket.status).color}`}>
                              {getStatusBadge(ticket.status).text}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(ticket.updated_at).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedTicket(ticket)}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              بررسی و پاسخ
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}