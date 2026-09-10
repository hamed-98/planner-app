// components/dashboard/views/NotesView.tsx
'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  Plus,
  Share2,
  Search,
  BookOpen,
  Pin,
  Trash2,
  Upload,
  Link2,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note } from '@/types/dashboard';

interface NotesViewProps {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  onSaveNotes: (notes: Note[]) => void;
  playAudioFeedback: (type: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

// نرمال‌سازی متن فارسی برای تطابق دقیق‌تر
function normalizeFa(str: string): string {
  return str
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\u200c\s]+/g, ' ')
    .trim()
    .toLowerCase();
}

export default function NotesView({
  notes,
  activeNoteId,
  setActiveNoteId,
  onSaveNotes,
  playAudioFeedback,
  showToast,
}: NotesViewProps) {
  const [showNotesGraph, setShowNotesGraph] = useState(false);
  const [noteSearch, setNoteSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('همه');
  const [isDragOver, setIsDragOver] = useState(false);
  const [noteAttachments, setNoteAttachments] = useState<string[]>([]);
  const [showLinkSelector, setShowLinkSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const createBlankNote = () => {
    const fresh: Note = {
      id: crypto.randomUUID(),
      title: 'یادداشت جدید بی‌نام',
      content: '# یادداشت جدید\n\nمتن یادداشت خود را در اینجا بنویسید...',
      folder: 'یادداشت‌ها',
      tags: ['ایده'],
      isPinned: false,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
    };
    onSaveNotes([fresh, ...notes]);
    setActiveNoteId(fresh.id);
    showToast('یادداشت جدید ایجاد گردید.', 'success');
  };

  // درج آسان لینک یادداشت داخل ادیتور
  const insertLinkToNote = (targetNoteTitle: string) => {
    if (!activeNote) return;
    const linkSyntax = `[[${targetNoteTitle}]]`;
    const updatedContent = activeNote.content + `\n\n🔗 پیوند: ${linkSyntax}`;
    const updated = notes.map((n) =>
      n.id === activeNote.id ? { ...n, content: updatedContent } : n
    );
    onSaveNotes(updated);
    setShowLinkSelector(false);
    showToast(`پیوند "${targetNoteTitle}" افزوده شد.`, 'success');
  };

  const filteredNotes = notes.filter((n) => {
    const searchMatch =
      n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noteSearch.toLowerCase());
    const folderMatch = selectedFolder === 'همه' || n.folder === selectedFolder;
    return searchMatch && folderMatch;
  });

  // محاسبه هوشمند گره‌ها و یال‌های گراف
  const graphData = useMemo(() => {
    const cx = 200;
    const cy = 200;
    const radius = 125;
    const count = notes.length || 1;

    // ۱. استخراج یال‌ها بر مبنای ارجاع متنی صریح و تگ‌های مشترک
    const edges: {
      fromId: string;
      toId: string;
      type: 'direct' | 'tag';
    }[] = [];

    const connectionsCountMap = new Map<string, number>();
    notes.forEach((n) => connectionsCountMap.set(n.id, 0));

    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i];
        const b = notes[j];

        const normATitle = normalizeFa(a.title);
        const normBTitle = normalizeFa(b.title);
        const normAContent = normalizeFa(a.content);
        const normBContent = normalizeFa(b.content);

        // شرط ۱: ارجاع مستقیم متن با عنوان یا براکت
        const directLink =
          (normBTitle.length > 2 &&
            (normAContent.includes(`[[${normBTitle}]]`) || normAContent.includes(normBTitle))) ||
          (normATitle.length > 2 &&
            (normBContent.includes(`[[${normATitle}]]`) || normBContent.includes(normATitle)));

        // شرط ۲: برچسب‌های مشترک
        const sharedTags = (a.tags || []).filter(
          (tag) => tag && (b.tags || []).includes(tag)
        );

        if (directLink) {
          edges.push({ fromId: a.id, toId: b.id, type: 'direct' });
          connectionsCountMap.set(a.id, (connectionsCountMap.get(a.id) || 0) + 1);
          connectionsCountMap.set(b.id, (connectionsCountMap.get(b.id) || 0) + 1);
        } else if (sharedTags.length > 0) {
          edges.push({ fromId: a.id, toId: b.id, type: 'tag' });
          connectionsCountMap.set(a.id, (connectionsCountMap.get(a.id) || 0) + 0.5);
          connectionsCountMap.set(b.id, (connectionsCountMap.get(b.id) || 0) + 0.5);
        }
      }
    }

    // ۲. نگاشت گره‌ها با شعاع متغیر بر اساس میزان اتصال
    const nodes = notes.map((note, index) => {
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      const connections = connectionsCountMap.get(note.id) || 0;
      const nodeRadius = Math.min(14, Math.max(6, 6 + connections * 2));

      return {
        id: note.id,
        title: note.title,
        folder: note.folder,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        r: nodeRadius,
        connections: Math.round(connections),
      };
    });

    const nodePositionMap = new Map(nodes.map((n) => [n.id, n]));

    const mappedEdges = edges
      .map((e) => {
        const from = nodePositionMap.get(e.fromId);
        const to = nodePositionMap.get(e.toId);
        if (!from || !to) return null;
        return { from, to, type: e.type };
      })
      .filter(Boolean) as {
      from: { x: number; y: number };
      to: { x: number; y: number };
      type: 'direct' | 'tag';
    }[];

    return { nodes, edges: mappedEdges };
  }, [notes]);

  // کنترل درگ‌اند‌دراپ فایل
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        fileNames.push(e.dataTransfer.files[i].name);
      }
      setNoteAttachments([...noteAttachments, ...fileNames]);
      showToast(`${fileNames.length} فایل پیوست گردید.`, 'info');
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileNames.push(e.target.files[i].name);
      }
      setNoteAttachments([...noteAttachments, ...fileNames]);
      showToast(`${fileNames.length} فایل پیوست شد.`, 'info');
    }
  };

  // حذف خودکار پیوند از داخل متن یادداشت
  const removeLinkToNote = (targetTitle: string) => {
    if (!activeNote) return;
    const escaped = targetTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // پاک کردن تگ براکت یا سطر ارجاعی پیوند
    const linkRegex = new RegExp(`(\\n*🔗 پیوند:\\s*)?\\[\\[${escaped}\\]\\]`, 'g');
    const newContent = activeNote.content.replace(linkRegex, '').trim();

    const updated = notes.map((n) =>
      n.id === activeNote.id ? { ...n, content: newContent } : n
    );
    onSaveNotes(updated);
    playAudioFeedback('click');
    showToast(`پیوند به "${targetTitle}" حذف گردید.`, 'info');
  };

  // رنگ پوشه‌بندی در گراف
  const getNodeColor = (folder: string, isActive: boolean) => {
    if (isActive) return '#2DD4BF'; // Teal روشن
    if (folder === 'برنامه‌ها') return '#818CF8'; // Indigo
    if (folder === 'هوشمند') return '#C084FC'; // Purple
    return '#64748B'; // Slate
  };

  return (
    <div className="space-y-6">
      {/* هدر ماژول */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">دفترچه یادداشت‌های من</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ایده‌ها و برنامه‌ها را با ساختار پوشه‌بندی و شبکه ارتباطی بصری ثبت کنید.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowNotesGraph((prev) => !prev);
              playAudioFeedback('click');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              showNotesGraph
                ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
            title="نمایش شبکه ارتباطات یادداشت‌ها"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>نمای گراف روابط Obsidian</span>
          </button>

          <button
            type="button"
            onClick={createBlankNote}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>یادداشت جدید</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {showNotesGraph ? (
          /* نمای گراف روابط معنادار */
          <div className="md:col-span-2 space-y-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center shadow-inner min-h-[480px] flex flex-col justify-between overflow-hidden relative">
              <div className="flex justify-between items-center z-10" dir="rtl">
                <div className="text-right">
                  <span className="text-[10px] font-bold text-teal-400 block tracking-widest uppercase">
                    شبکه شناختی ایده‌ها
                  </span>
                  <h4 className="text-xs font-black text-white">اتصالات معنایی و ساختار پوشه‌ها</h4>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-teal-400 inline-block" /> پیوند متنی
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-indigo-400 border-b border-dashed inline-block" /> برچسب مشترک
                  </span>
                </div>
              </div>

              {/* بستر مقیاس‌پذیر SVG */}
              <div className="relative w-full flex-1 flex items-center justify-center min-h-[320px]">
                <svg viewBox="0 0 400 400" className="w-full h-full max-w-[380px] max-h-[380px]">
                  {/* رندر یال‌ها */}
                  {graphData.edges.map((e, idx) => (
                    <line
                      key={`edge-${idx}`}
                      x1={e.from.x}
                      y1={e.from.y}
                      x2={e.to.x}
                      y2={e.to.y}
                      stroke={e.type === 'direct' ? '#14B8A6' : '#818CF8'}
                      strokeWidth={e.type === 'direct' ? '1.5' : '1'}
                      strokeOpacity={e.type === 'direct' ? '0.75' : '0.35'}
                      strokeDasharray={e.type === 'tag' ? '4 3' : undefined}
                    />
                  ))}

                  
                  {/* رندر گره‌ها */}
                  {graphData.nodes.map((n) => {
                    const isActive = n.id === activeNoteId;
                    const fill = getNodeColor(n.folder, isActive);

                    return (
                      <g
                        key={n.id}
                        className="cursor-pointer group"
                        onClick={() => {
                          setActiveNoteId(n.id);
                          playAudioFeedback('click');
                          showToast(`تمرکز روی: "${n.title}" (${n.connections} ارتباط)`, 'info');
                        }}
                      >
                        {/* ۱. هیت‌باکس نامرئی برای ثبات موس و جلوگیری ۱۰۰٪ از پرش */}
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={n.r + 12}
                          fill="transparent"
                          className="pointer-events-auto"
                        />

                        {/* ۲. دایره اصلی با مبدا انیمیشن مهارشده */}
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={n.r}
                          fill={fill}
                          stroke={isActive ? '#CCFBF1' : '#1E293B'}
                          strokeWidth={isActive ? '3' : '1.5'}
                          className="transition-all duration-200 group-hover:stroke-teal-300 group-hover:stroke-[3.5px] [transform-box:fill-box] origin-center group-hover:scale-115 pointer-events-none"
                        />

                        <text
                          x={n.x}
                          y={n.y - n.r - 5}
                          textAnchor="middle"
                          fill={isActive ? '#2DD4BF' : '#94A3B8'}
                          className="text-[9px] font-bold pointer-events-none select-none font-sans group-hover:fill-teal-300 transition-colors"
                        >
                          {n.title.slice(0, 15)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <p className="text-[10px] text-slate-400 text-center leading-normal" dir="rtl">
                💡 گره‌های بزرگ‌تر نشان‌دهنده اسناد پرپیوندتر هستند. با لمس هر گره، سند آن باز می‌شود.
              </p>
            </div>
          </div>
        ) : (
          /* ستون جستجو، پوشه‌ها و لیست یادداشت‌ها */
          <>
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="relative">
                  <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو در متون..."
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 px-2">
                  پوشه‌بندی
                </span>
                {['همه', 'یادداشت‌ها', 'برنامه‌ها', 'هوشمند'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedFolder(f)}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                      selectedFolder === f
                        ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 overflow-y-auto max-h-[500px] space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2 px-1">لیست نوشته‌ها</span>
              <AnimatePresence mode="popLayout">
                {filteredNotes.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 text-slate-400"
                  >
                    <BookOpen className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    <span className="text-[10px]">نوشته‌ای یافت نشد</span>
                  </motion.div>
                )}
                {filteredNotes.map((n) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={n.id}
                    onClick={() => setActiveNoteId(n.id)}
                    className={`w-full text-right p-3 rounded-2xl border cursor-pointer transition-colors block ${
                      activeNoteId === n.id
                        ? 'bg-teal-50/40 dark:bg-teal-950/30 border-teal-300 dark:border-teal-700'
                        : 'bg-slate-50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{n.title}</h4>
                      {n.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{n.content.slice(0, 40)}...</p>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* ادیتور یادداشت فعال */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 md:col-span-2 space-y-4">
          {activeNote ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <input
                  type="text"
                  value={activeNote.title}
                  onChange={(e) => {
                    const updated = notes.map((n) =>
                      n.id === activeNote.id ? { ...n, title: e.target.value } : n
                    );
                    onSaveNotes(updated);
                  }}
                  className="font-black text-base text-slate-900 dark:text-slate-100 focus:outline-none bg-transparent flex-1"
                />

                <div className="flex items-center gap-2">
                  {/* ابزار درج لینک به یادداشت دیگر */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLinkSelector(!showLinkSelector)}
                      className="p-2 rounded-xl text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="پیوند به یادداشت دیگر"
                    >
                      <Link2 className="w-4 h-4" />
                      <span className="hidden sm:inline">پیوند</span>
                    </button>

                    {showLinkSelector && (
                      <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-30 max-h-48 overflow-y-auto">
                        <span className="text-[9px] font-bold text-slate-400 block px-2 mb-1">
                          انتخاب سند برای پیوند:
                        </span>
                        {notes
                          .filter((n) => n.id !== activeNote.id)
                          .map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => insertLinkToNote(n.title)}
                              className="w-full text-right p-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 truncate block cursor-pointer"
                            >
                              {n.title}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = notes.map((n) =>
                        n.id === activeNote.id ? { ...n, isPinned: !n.isPinned } : n
                      );
                      onSaveNotes(updated);
                    }}
                    className={`p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                      activeNote.isPinned ? 'text-amber-500' : 'text-slate-400'
                    }`}
                    title="پین کردن در بالا"
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = notes.filter((n) => n.id !== activeNote.id);
                      onSaveNotes(updated);
                      setActiveNoteId(updated[0]?.id || null);
                      showToast('یادداشت حذف شد.', 'info');
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                    title="حذف دائمی"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <textarea
                value={activeNote.content}
                onChange={(e) => {
                  const updated = notes.map((n) =>
                    n.id === activeNote.id ? { ...n, content: e.target.value } : n
                  );
                  onSaveNotes(updated);
                }}
                className="w-full h-80 focus:outline-none p-3.5 resize-none text-xs rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 font-mono focus:border-teal-500 leading-relaxed text-slate-700 dark:text-slate-300"
              />

              {/* قالب‌های آماده */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400">قالب‌های آماده:</span>
                {[
                  {
                    name: '📝 روزنگار',
                    template:
                      '# روزنگار هوشمند کایزن\n\n## 🌟 سپاسگزاری امروز:\n۱. \n۲. \n\n## 🎯 تمرکز کاری امروز:\n- \n\n## 💭 بازتاب احساسی:\n',
                  },
                  {
                    name: '💼 جلسه',
                    template:
                      '# یادداشت جلسه کورتکس\n\n**موضوع:** \n**تاریخ:** \n**حاضرین:** \n\n## 📝 نکات کلیدی:\n- \n\n## 📌 اکشن آیتم‌ها:\n- [ ] پیگیری کار تیم',
                  },
                  {
                    name: '📖 کتاب',
                    template:
                      '# خلاصه کتاب جدید\n\n**عنوان:** \n**نویسنده:** \n\n## 💡 آموخته‌های کلیدی:\n۱. \n\n## 🎯 اقدام عملی:\n- ',
                  },
                  {
                    name: '💡 ایده',
                    template:
                      '# بوم طوفان فکری ایده\n\n**فرضیه اصلی:** \n**ارزش پیشنهادی:** \n\n## 🚀 گام اقدام:\n- [ ] تست ایده ',
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      const updated = notes.map((n) =>
                        n.id === activeNote.id ? { ...n, content: tmpl.template } : n
                      );
                      onSaveNotes(updated);
                      showToast(`قالب "${tmpl.name}" اعمال شد!`, 'success');
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-slate-200 dark:border-slate-700 hover:border-teal-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>

              {/* لیست پیوندهای خروجی همین یادداشت با امکان حذف سریع */}
              {(() => {
                const outgoingLinks = notes.filter(
                  (n) =>
                    n.id !== activeNote.id &&
                    n.title.trim() &&
                    activeNote.content.includes(`[[${n.title}]]`)
                );

                if (outgoingLinks.length > 0) {
                  return (
                    <div className="bg-teal-50/40 dark:bg-teal-950/20 p-2.5 rounded-2xl border border-teal-100 dark:border-teal-900/50 mt-2" dir="rtl">
                      <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 block mb-1.5">
                        🔗 پیوندهای ثبت‌شده در این یادداشت :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {outgoingLinks.map((target) => (
                          <span
                            key={target.id}
                            className="text-[9px] bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold shadow-xs"
                          >
                            <span>{target.title}</span>
                            <button
                              type="button"
                              onClick={() => removeLinkToNote(target.title)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer text-[10px] hover:scale-125 transition-transform"
                              title="حذف پیوند"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* ردیاب پیوندهای معکوس (با گارد عنوان معتبر) */}
              {(() => {
                const titleQuery = activeNote.title.trim();
                const backlinks = titleQuery
                  ? notes.filter(
                      (n) =>
                        n.id !== activeNote.id &&
                        (n.content.includes(titleQuery) || n.content.includes(`[[${titleQuery}]]`))
                    )
                  : [];

                if (backlinks.length > 0) {
                  return (
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5 font-sans">
                        🔗 یادداشت‌های ارجاع‌دهنده به این سند (Backlinks):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {backlinks.map((bl) => (
                          <button
                            key={bl.id}
                            type="button"
                            onClick={() => {
                              setActiveNoteId(bl.id);
                              playAudioFeedback('click');
                            }}
                            className="text-[9px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-teal-400 text-slate-600 dark:text-slate-300 hover:text-teal-600 px-2 py-0.5 rounded-lg transition-all cursor-pointer"
                          >
                            {bl.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* پیوست اسناد */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  پیوست فایل و تصاویر (Drag & Drop)
                </span>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-teal-500 bg-teal-50/10'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/40'
                  }`}
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    فایل خود را به اینجا بکشید یا برای انتخاب کلیک کنید.
                  </p>
                  <input type="file" multiple ref={fileInputRef} onChange={handleManualFileSelect} className="hidden" />
                </div>

                {noteAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {noteAttachments.map((file, i) => (
                      <span
                        key={i}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                      >
                        <span>{file}</span>
                        <button
                          type="button"
                          onClick={() => setNoteAttachments(noteAttachments.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 italic text-sm">
              یادداشتی انتخاب نشده است. از ستون راست یکی را انتخاب کرده یا یادداشت جدید بسازید.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}