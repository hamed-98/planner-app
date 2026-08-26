'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Plus, 
  Trash2, 
  Activity, 
  Brain, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Copy, 
  Check, 
  ShieldCheck, 
  Edit2, 
  X, 
  Menu, 
  AlertTriangle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '../lib/supabase/client';
import { 
  Conversation, 
  ChatMessage, 
  getConversations, 
  createConversation, 
  deleteConversation, 
  getConversationMessages, 
  saveChatMessage, 
  getAiUsageToday
} from '../lib/supabase/assistant';
import { Task, CalendarEvent, Note } from './Dashboard';

interface AssistantViewProps {
  userDataContext: any;
  onAddTask: (task: Partial<Task>) => void;
  onAddEvent: (event: Partial<CalendarEvent>) => void;
  onAddNote: (note: Partial<Note>) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

export default function AssistantView({
  userDataContext,
  onAddTask,
  onAddEvent,
  onAddNote,
  showToast,
  playAudioFeedback
}: AssistantViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  
  // ریسپانسیو و سایدبار موبایل
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // تغییر نام چت
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');

  // مدال سفارشی حذف گفتگو
  const [convToDelete, setConvToDelete] = useState<string | null>(null);

  // وضعیت اکشن‌های تایید شده توسط کاربر
  const [confirmedActionMsgIds, setConfirmedActionMsgIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    async function initThreads() {
      const threads = await getConversations();
      setConversations(threads);
      if (threads.length > 0) {
        setActiveConvId(threads[0].id);
      } else {
        const fresh = await createConversation('گفتگوی جدید');
        if (fresh) {
          setConversations([fresh]);
          setActiveConvId(fresh.id);
        }
      }
    }
    initThreads();
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    async function loadMessages() {
      const msgs = await getConversationMessages(activeConvId!);
      setMessages(msgs);
    }
    loadMessages();
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  const [aiUsage, setAiUsage] = useState<{ count: number; limit: number; plan: string }>({ count: 0, limit: 15, plan: 'free' });

  useEffect(() => {
    getAiUsageToday().then(setAiUsage);
  }, []);

  // تایید و ثبت اکشن در سیستم + ذخیره دائمی وضعیت در دیتابیس
  const handleConfirmAction = async (msg: ChatMessage) => {
    if (!msg.action_payload?.action || !msg.action_payload?.payload) return;
    const { action, payload } = msg.action_payload;

    if (action === 'ADD_TASK') {
      onAddTask(payload);
      showToast(`وظیفه "${payload.title}" در لیست کارها ثبت شد.`, 'success');
    } else if (action === 'ADD_EVENT') {
      onAddEvent(payload);
      showToast(`رویداد "${payload.title}" در تقویم ثبت شد.`, 'success');
    } else if (action === 'ADD_NOTE') {
      onAddNote(payload);
      showToast(`یادداشت "${payload.title}" ذخیره شد.`, 'success');
    }

    // به‌روزرسانی وضعیت در دیتابیس و کش محلی
    const updatedPayload = { ...msg.action_payload, status: 'confirmed' };
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, action_payload: updatedPayload } : m));
    localStorage.setItem(`sayeban_action_status_${msg.id}`, 'confirmed');

    const supabase = createClient();
    await (supabase.from('ai_messages') as any)
      .update({ action_payload: updatedPayload })
      .eq('id', msg.id);

    playAudioFeedback?.('done');
  };

  // رد و لغو پیشنهاد هوش مصنوعی
  const handleRejectAction = async (msg: ChatMessage) => {
    const updatedPayload = { ...msg.action_payload, status: 'rejected' };
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, action_payload: updatedPayload } : m));
    localStorage.setItem(`sayeban_action_status_${msg.id}`, 'rejected');

    const supabase = createClient();
    await (supabase.from('ai_messages') as any)
      .update({ action_payload: updatedPayload })
      .eq('id', msg.id);

    showToast('پیشنهاد ثبت لغو شد.', 'info');
  };

  const handleNewConversation = async () => {
    playAudioFeedback?.('click');
    // لغو درخواست در حال اجرای چت قبلی و خاموش کردن لودینگ
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAiResponding(false);

    const fresh = await createConversation('گفتگوی جدید');
    if (fresh) {
      setConversations(prev => [fresh, ...prev]);
      setActiveConvId(fresh.id);
      setMessages([]);
      setIsMobileSidebarOpen(false);
      showToast('گفتگوی جدید ایجاد شد.', 'info');
    }
  };

  const handleSaveRename = async (id: string) => {
    if (!editTitleText.trim()) {
      setEditingConvId(null);
      return;
    }
    const supabase = createClient();
    await (supabase as any).from('ai_conversations').update({ title: editTitleText.trim() }).eq('id', id);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: editTitleText.trim() } : c));
    setEditingConvId(null);
    showToast('عنوان گفتگو به‌روزرسانی شد.', 'success');
  };

  const handleConfirmDelete = async () => {
    if (!convToDelete) return;
    await deleteConversation(convToDelete);
    const updated = conversations.filter(c => c.id !== convToDelete);
    setConversations(updated);
    if (activeConvId === convToDelete) {
      setActiveConvId(updated[0]?.id || null);
    }
    setConvToDelete(null);
    showToast('گفتگو با موفقیت حذف شد.', 'info');
  };

  const handleExecuteAction = (msgId: string, actionData: any) => {
    if (!actionData?.action || !actionData?.payload) return;
    const { action, payload } = actionData;

    if (action === 'ADD_TASK') {
      onAddTask(payload);
      showToast(`وظیفه "${payload.title}" به کارهای شما افزوده شد.`, 'success');
    } else if (action === 'ADD_EVENT') {
      onAddEvent(payload);
      showToast(`رویداد "${payload.title}" در تقویم ثبت گردید.`, 'success');
    } else if (action === 'ADD_NOTE') {
      onAddNote(payload);
      showToast(`یادداشت "${payload.title}" ذخیره شد.`, 'success');
    }

    setConfirmedActionMsgIds(prev => new Set(prev).add(msgId));
    playAudioFeedback?.('done');
  };

  // تابع کمکی برای نمایش تمیز و شمسی تاریخ روی کارت اکشن
  const formatActionDate = (dateStr?: string) => {
    if (!dateStr) return 'امروز';
    const clientToday = userDataContext?.clientToday || new Date().toISOString().split('T')[0];
    
    const todayObj = new Date(clientToday + "T12:00:00Z");
    const tomorrowStr = new Date(todayObj.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayAfterStr = new Date(todayObj.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const jalaliDate = new Date(dateStr + "T12:00:00Z").toLocaleDateString('fa-IR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      if (dateStr === clientToday) return `امروز (${jalaliDate})`;
      if (dateStr === tomorrowStr) return `فردا (${jalaliDate})`;
      if (dateStr === dayAfterStr) return `پس‌فردا (${jalaliDate})`;
      return jalaliDate;
    } catch {
      return dateStr;
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || !activeConvId || isAiResponding) return;
    if (textToSend.length > 1000) {
    showToast('متن پیام نمی‌تواند بیش از ۱۰۰۰ کاراکتر باشد.', 'error');
      return;
    }

    // آماده‌سازی سیگنال کنسل کردن
    abortControllerRef.current = new AbortController();

    setInputMessage('');
    playAudioFeedback?.('click');

    // نام‌گذاری هوشمند در اولین پیام
    const isFirstMsg = messages.length === 0;
    if (isFirstMsg) {
      const autoTitle = textToSend.slice(0, 26) + (textToSend.length > 26 ? '...' : '');
      const supabase = createClient();
      await (supabase.from('ai_conversations') as any).update({ title: autoTitle }).eq('id', activeConvId);
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, title: autoTitle } : c));
    }

    // ثبت پیام کاربر
    const userMsg = await saveChatMessage(activeConvId, 'user', textToSend);
    if (userMsg) {
      setMessages(prev => [...prev, userMsg]);
    }

    setIsAiResponding(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers,
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          mode: 'workspace_chat',
          message: textToSend,
          userData: userDataContext,
          history: messages.map(m => ({ sender: m.sender, content: m.content }))
        })
      });

      const data = await res.json();

      // ۱. اگر سقف پیام‌ها پر شده بود
      if (res.status === 429) {
        if (data.currentUsage !== undefined && data.dailyLimit) {
          setAiUsage(prev => ({ ...prev, count: data.currentUsage, limit: data.dailyLimit }));
        }
        showToast(data.text, 'error');
        setIsAiResponding(false);
        return;
      }

      // ۲. آپدیت آنی شمارنده مصرف
      if (data.currentUsage !== undefined && data.dailyLimit) {
        setAiUsage(prev => ({ ...prev, count: data.currentUsage, limit: data.dailyLimit }));
      } else {
        setAiUsage(prev => ({ ...prev, count: Math.min(prev.limit, prev.count + 1) }));
      }

      const hasValidAction = data.actionData?.action && data.actionData.action !== 'NONE' && data.actionData?.payload?.title;

      // ۳. ثبت پاسخ دستیار در دیتابیس
      const aiMsg = await saveChatMessage(
        activeConvId,
        'assistant',
        data.text,
        hasValidAction ? data.actionData : undefined
      );

      if (aiMsg) {
        setMessages(prev => [...prev, aiMsg]);
        playAudioFeedback?.('done');
      }
    } catch (err: any) {
      // اگر کاربر چت جدید باز کرد یا تغییر چت داد، خطای لغو نادیده گرفته می‌شود
      if (err.name === 'AbortError') {
        return;
      }
      console.error(err);
      showToast('خطا در دریافت پاسخ از هوش مصنوعی.', 'error');
    } finally {
      setIsAiResponding(false);
    } 
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="space-y-4 md:space-y-6" dir="rtl">
      {/* مدال اختصاصی تایید حذف گفتگو */}
      <AnimatePresence>
        {convToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-right"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  حذف این گفتگو؟
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  تمام پیام‌های رد و بدل شده در این جلسه پاک خواهند شد و امکان
                  بازیابی وجود ندارد.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleConfirmDelete}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  بله، حذف شود
                </button>
                <button
                  onClick={() => setConvToDelete(null)}
                  className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* هدر بالایی */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-4 md:p-6 rounded-3xl text-white shadow-xl flex items-center justify-between gap-4 border border-teal-500/20">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/30 shrink-0">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-xl font-black">
                دستیار هوشمند سایبان
              </h2>
              <span className="text-[9px] md:text-[10px] bg-teal-500/20 text-teal-300 font-extrabold px-2.5 py-0.5 rounded-full border border-teal-500/30 hidden sm:inline-block">
                هوش متمرکز
              </span>
            </div>
            <p className="text-[11px] md:text-xs text-slate-300 mt-0.5">
              تحلیلگر سبک زندگی، مربی بازسازی افکار CBT و مشاور هوشمند کارها.
            </p>
          </div>
        </div>

        {/* دکمه باز کردن سایدبار در موبایل */}
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="lg:hidden p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 hover:text-white cursor-pointer"
          title="سوابق و کانتکست"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* چیدمان اصلی */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-[580px] relative">
        {/* ستون سایدبار (در دسکتاپ ثابت، در موبایل کشویی) */}
        <div
          className={`
          lg:col-span-1 space-y-4
          ${isMobileSidebarOpen ? "fixed inset-0 z-40 bg-slate-950/80 p-4 flex flex-col justify-center overflow-y-auto" : "hidden lg:block"}
        `}
        >
          {isMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden self-end p-2 bg-slate-800 text-white rounded-full mb-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleNewConversation}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>گفتگوی جدید</span>
          </button>

          {/* لیست سوابق */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3 shadow-sm space-y-1.5 max-h-60 overflow-y-auto">
            <span className="text-[10px] font-black text-slate-400 block px-2 mb-1 uppercase tracking-wider">
              سوابق جلسات چت
            </span>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  if (editingConvId !== conv.id) {
                    setIsAiResponding(false);
                    setActiveConvId(conv.id);
                    setIsMobileSidebarOpen(false);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  activeConvId === conv.id
                    ? "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                {editingConvId === conv.id ? (
                  <div
                    className="flex items-center gap-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      autoFocus
                      value={editTitleText}
                      onChange={(e) => setEditTitleText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveRename(conv.id);
                        if (e.key === "Escape") setEditingConvId(null);
                      }}
                      className="flex-1 bg-white dark:bg-slate-800 text-xs p-1 rounded border border-teal-500 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      onClick={() => handleSaveRename(conv.id)}
                      className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingConvId(null)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{conv.title}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditTitleText(conv.title);
                        }}
                        className="p-1 hover:text-teal-600"
                        title="تغییر نام"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConvToDelete(conv.id);
                        }}
                        className="p-1 hover:text-rose-500"
                        title="حذف"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* کانتکست زنده داده‌ها */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>داده‌های دریافتی دستیار</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="space-y-2 text-[11px] font-bold">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>خواب دیشب:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                  {userDataContext?.sleepHours
                    ? `${userDataContext.sleepHours} ساعت`
                    : "ثبت‌نشده"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>آب امروز:</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono">
                  {userDataContext?.waterToday || 0} ml
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>حافظه کاری:</span>
                <span className="text-purple-600 dark:text-purple-400 font-mono">
                  {userDataContext?.brainMemory || 0} / ۱۰۰
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>زمان واکنش:</span>
                <span className="text-amber-600 dark:text-amber-400 font-mono">
                  {userDataContext?.brainReaction
                    ? `${userDataContext.brainReaction}ms`
                    : "بدون آزمون"}
                </span>
              </div>
            </div>
          </div>

          {/* ویجت میزان مصرف و سهمیه روزانه هوش مصنوعی */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>سهمیه روزانه هوش مصنوعی</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                {aiUsage.plan === "pro" ? "اشتراک Pro" : "پلن رایگان"}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>مصرف امروز:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {aiUsage.count} از {aiUsage.limit} پیام
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    aiUsage.count >= aiUsage.limit
                      ? "bg-rose-500"
                      : aiUsage.count >= aiUsage.limit * 0.8
                        ? "bg-amber-500"
                        : "bg-teal-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (aiUsage.count / aiUsage.limit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold text-left pt-0.5">
                {Math.max(0, aiUsage.limit - aiUsage.count)} پیام باقی‌مانده تا
                ۱۲ شب
              </p>
            </div>
          </div>
        </div>

        {/* ستون محیط چت اصلی */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 md:p-6 shadow-sm flex flex-col justify-between lg:col-span-3 min-h-[540px]">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[460px]">
            {messages.length === 0 && (
              <div className="text-center py-12 md:py-16 space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
                  <Brain className="w-7 h-7 md:w-8 md:h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    دستیار هوشمند سایبان در خدمت شماست
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                    درباره برنامه‌ریزی روزانه، مدیریت استرس، بازسازی افکار یا
                    تحلیل خواب با من گفتگو کنید.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {[
                    "📊 تحلیل همبستگی خواب با بازدهی امروزم",
                    "🎯 اولویت‌بندی کارهای امروز بر اساس سطح انرژی",
                    "🧠 کمک به بازسازی یک فکر منفی و نشخوار ذهنی",
                    "⚡ پیشنهاد ساختار زمانی برای کارهای امروز",
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200/60 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[90%] md:max-w-[85%] rounded-3xl p-4 space-y-2.5 relative group leading-relaxed text-xs font-medium ${
                      msg.sender === "user"
                        ? "bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-600/10"
                        : "bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700/60"
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-loose">
                      {msg.content}
                    </p>

                    {/* کارت تایید اقدام پیشنهادی */}
                    {msg.action_payload &&
                      msg.action_payload.action &&
                      msg.action_payload.action !== "NONE" && (
                        <div className="bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700/80 p-3.5 rounded-2xl text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-3 space-y-2.5 shadow-sm">
                          <div className="flex items-center justify-between text-teal-700 dark:text-teal-300">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-teal-500" />
                              <span>پیشنهاد اقدام در سیستم:</span>
                            </span>
                            <span className="text-[10px] bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                              {msg.action_payload.action === "ADD_TASK"
                                ? "وظیفه"
                                : msg.action_payload.action === "ADD_EVENT"
                                  ? "رویداد تقویم"
                                  : "یادداشت"}
                            </span>
                          </div>

                          <div className="text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                              {msg.action_payload.payload?.title}
                            </div>
                            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">
                              تاریخ:{" "}
                              {formatActionDate(
                                msg.action_payload.payload?.targetDate,
                              )}
                              {msg.action_payload.payload?.time
                                ? ` | ساعت: ${msg.action_payload.payload.time}`
                                : ""}
                            </div>
                          </div>

                          {/* بررسی وضعیت تایید / رد */}
                          {(() => {
                            const status =
                              msg.action_payload?.status ||
                              (typeof window !== "undefined"
                                ? localStorage.getItem(
                                    `sayeban_action_status_${msg.id}`,
                                  )
                                : null);

                            if (status === "confirmed") {
                              return (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold pt-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>این مورد در سیستم ثبت گردید.</span>
                                </div>
                              );
                            }

                            if (status === "rejected") {
                              return (
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-bold pt-1">
                                  <X className="w-4 h-4 text-rose-500" />
                                  <span>این پیشنهاد لغو گردید.</span>
                                </div>
                              );
                            }

                            return (
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAction(msg)}
                                  className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تایید و ثبت در برنامه</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectAction(msg)}
                                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                  رد
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 transition-opacity"
                      title="کپی"
                    >
                      {copiedMsgId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isAiResponding && (
              <div className="flex justify-start">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-3xl rounded-bl-none border border-slate-100 dark:border-slate-700/60 flex items-center gap-2 text-xs text-slate-400 font-bold animate-pulse">
                  <Sparkles className="w-4 h-4 text-teal-500 animate-spin" />
                  <span>دستیار در حال تحلیل و آماده‌سازی پاسخ...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* اینپوت ورودی با Shift+Enter */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:border-teal-500 transition-colors"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                maxLength={1000}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder=" پیام خود را تایپ کنید..."
                className="flex-1 p-2 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none resize-none max-h-32"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isAiResponding}
                className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-teal-600/15"
              >
                <Send className="w-4 h-4 rotate-280" />
              </button>
            </form>
            <div className="flex justify-between items-center text-[10px] text-slate-400 px-2 font-bold">
              {/* <span>Shift + Enter برای خط جدید</span> */}
              <span className={inputMessage.length >= 900 ? 'text-amber-500 font-mono' : 'font-mono'}>
                {inputMessage.length} / ۱۰۰۰ کاراکتر
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}