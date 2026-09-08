// components/dashboard/views/NotesView.tsx
'use client';

import React, { useState, useRef } from 'react';
import {
  Plus,
  Share2,
  Search,
  BookOpen,
  Pin,
  Trash2,
  Upload,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createBlankNote = () => {
    const fresh: Note = {
      id: crypto.randomUUID(),
      title: 'یادداشت جدید بی‌نام',
      content: '# یادداشت جدید\n\nمتن یادداشت خود را در اینجا بنویسید...',
      folder: 'یادداشت‌ها',
      tags: ['کار'],
      isPinned: false,
      updatedAt: new Date().toLocaleDateString('fa-IR'),
    };
    onSaveNotes([fresh, ...notes]);
    setActiveNoteId(fresh.id);
    showToast('یادداشت جدید ایجاد گردید.', 'success');
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const filteredNotes = notes.filter((n) => {
    const searchMatch =
      n.title.toLowerCase().includes(noteSearch.toLowerCase()) ||
      n.content.toLowerCase().includes(noteSearch.toLowerCase());
    const folderMatch = selectedFolder === 'همه' || n.folder === selectedFolder;
    return searchMatch && folderMatch;
  });

  // هندلرهای درگ‌اند‌دراپ فایل
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        fileNames.push(e.dataTransfer.files[i].name);
      }
      setNoteAttachments([...noteAttachments, ...fileNames]);
      showToast(`${fileNames.length} فایل ضمیمه گردید.`, 'info');
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames: string[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileNames.push(e.target.files[i].name);
      }
      setNoteAttachments([...noteAttachments, ...fileNames]);
      showToast(`${fileNames.length} فایل ضمیمه شد.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* هدر بخش یادداشت‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">دفترچه یادداشت‌های من</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ایده‌ها، صورتجلسات و برنامه‌های بلندمدت خود را با ساختار پوشه‌بندی و پیوندهای متقابل ثبت کنید.
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
            title="نمایش نمایه ارتباطات هوشمند بین یادداشت‌ها"
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
          /* نمای گراف روابط شبیه به Obsidian */
          <div className="md:col-span-2 space-y-4 animate-fadeIn">
            {(() => {
              const radius = 100;
              const cx = 180;
              const cy = 180;
              const mappedNodes = notes.map((note, index) => {
                const angle = (index / (notes.length || 1)) * 2 * Math.PI;
                return {
                  id: note.id,
                  title: note.title,
                  isPinned: note.isPinned,
                  x: cx + radius * Math.cos(angle),
                  y: cy + radius * Math.sin(angle),
                };
              });

              const edges: {
                from: { x: number; y: number; id: string };
                to: { x: number; y: number; id: string };
              }[] = [];

              for (let i = 0; i < mappedNodes.length; i++) {
                for (let j = i + 1; j < mappedNodes.length; j++) {
                  const nodeA = notes[i];
                  const nodeB = notes[j];
                  const posA = mappedNodes[i];
                  const posB = mappedNodes[j];

                  const linkAtoB =
                    nodeA.content.includes(`[[${nodeB.title}]]`) || nodeA.content.includes(nodeB.title);
                  const linkBtoA =
                    nodeB.content.includes(`[[${nodeA.title}]]`) || nodeB.content.includes(nodeA.title);
                  const overlapping =
                    nodeA.title && nodeB.title && nodeA.title.slice(0, 3) === nodeB.title.slice(0, 3);

                  if (linkAtoB || linkBtoA || overlapping) {
                    edges.push({ from: posA, to: posB });
                  }
                }
              }

              return (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center shadow-inner min-h-[460px] flex flex-col justify-between overflow-hidden relative">
                  <div className="flex justify-between items-center z-10">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-cyan-400 block tracking-widest uppercase">
                        روابط هوشمند یادداشت‌ها
                      </span>
                      <h4 className="text-xs font-black text-white">شبکه روابط کورتکس</h4>
                    </div>
                    <span className="text-[9px] bg-slate-800 border border-slate-700 text-teal-400 py-0.5 px-2 rounded-full font-mono">
                      پیوندها: {edges.length} | نوشته‌ها: {notes.length}
                    </span>
                  </div>

                  <div className="relative w-full flex-1 flex items-center justify-center min-h-[290px]">
                    <svg viewBox="0 0 360 360" className="w-full h-full max-w-[340px] max-h-[300px]">
                      {edges.map((e, idx) => (
                        <line
                          key={`link-${idx}`}
                          x1={e.from.x}
                          y1={e.from.y}
                          x2={e.to.x}
                          y2={e.to.y}
                          stroke="#14B8A6"
                          strokeWidth="1.2"
                          strokeOpacity="0.45"
                          strokeDasharray="3 3"
                        />
                      ))}

                      {mappedNodes.map((n) => {
                        const isActive = n.id === activeNoteId;
                        return (
                          <g
                            key={n.id}
                            className="cursor-pointer group"
                            onClick={() => {
                              setActiveNoteId(n.id);
                              playAudioFeedback('click');
                              showToast(`تمرکز یادداشت روی: "${n.title}"`, 'info');
                            }}
                          >
                            <circle
                              cx={n.x}
                              cy={n.y}
                              r={isActive ? '9' : '6'}
                              fill={isActive ? '#14B8A6' : '#475569'}
                              stroke={isActive ? '#CCFBF1' : '#1E293B'}
                              strokeWidth="1.5"
                              className="transition-all duration-300 hover:fill-teal-400"
                            />
                            <text
                              x={n.x}
                              y={n.y - 11}
                              textAnchor="middle"
                              fill={isActive ? '#2DD4BF' : '#94A3B8'}
                              className="text-[8px] font-black pointer-events-none select-none font-sans"
                            >
                              {n.title.slice(0, 16)}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <p className="text-[9.5px] text-slate-400 text-center leading-normal">
                    💡 گره‌ها را لمس کنید تا یادداشت فعال تغییر کند.
                  </p>
                </div>
              );
            })()}
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

                <div className="flex gap-2">
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

              {/* ردیاب پیوندهای معکوس (Backlinks) */}
              {(() => {
                const backlinks = activeNote.title.trim()
                  ? notes.filter(
                      (n) =>
                        n.id !== activeNote.id &&
                        (n.content.includes(activeNote.title) ||
                          n.content.includes(`[[${activeNote.title}]]`)),
                    )
                  : [];
                if (backlinks.length > 0) {
                  return (
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 mt-2">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1.5 font-sans">
                        🔗 نوشته‌های ارجاع‌دهنده به این سند (Backlinks):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {backlinks.map((bl) => (
                          <button
                            key={bl.id}
                            type="button"
                            onClick={() => {
                              setActiveNoteId(bl.id);
                              playAudioFeedback("click");
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

              {/* ناحیه پیوست و درگ‌اند‌دراپ اسناد */}
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