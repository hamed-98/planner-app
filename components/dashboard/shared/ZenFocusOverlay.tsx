// components/dashboard/shared/ZenFocusOverlay.tsx
'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut,
  Settings,
  Music,
  SkipForward,
  SkipBack,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { Task } from '@/types/dashboard';
import { useZenSession } from '@/hooks/dashboard/useZenSession';

interface ZenFocusOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  earnXp: (amount: number, reason: string) => void;
  playAudioFeedback: (type: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export default function ZenFocusOverlay({
  isOpen,
  onClose,
  tasks,
  earnXp,
  playAudioFeedback,
  showToast,
}: ZenFocusOverlayProps) {
  const zen = useZenSession({ earnXp, playAudioFeedback, showToast });

  // همگام‌سازی وضعیت باز شدن
  useEffect(() => {
    zen.setIsZenMode(isOpen);
    if (isOpen) {
      zen.setIsZenAudioPlaying(true);
      zen.setIsZenTimerRunning(true);
      // واکشی دسته‌بندی‌های موزیک از تنظیمات سراسری در صورت خالی بودن
      if (zen.zenCategories.length === 0) {
        fetch('/api/settings?id=landing_page')
          .then((res) => res.json())
          .then((data) => {
            if (data?.zen_categories && data.zen_categories.length > 0) {
              zen.setZenCategories(data.zen_categories);
              zen.setZenActiveCatId(data.zen_categories[0].id);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen]);

  const handleExit = () => {
    zen.setIsZenMode(false);
    zen.setIsZenTimerRunning(false);
    zen.setIsZenAudioPlaying(false);
    playAudioFeedback('click');
    onClose();
  };

//   if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col justify-between p-8 font-sans bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white"
        >
          {/* هدر پنجره تمرکز */}
          <div
            className="flex flex-col xl:flex-row gap-4 items-center justify-between text-right border-b border-white/5 pb-4"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExit}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-2 font-black text-xs shadow-md shadow-rose-500/5 hover:scale-[1.02]"
                title="خروج از حالت تمرکز مطلق"
              >
                <LogOut className="w-4 h-4 transform rotate-180" />
                <span>خروج از تمرکز</span>
              </button>
              <h2 className="text-sm font-extrabold">
                محیط تمرکز مطلق (Zen & Pomodoro)
              </h2>
            </div>

            <div className="text-xs font-bold text-slate-400">
              با موسیقی پویا، تمرکز کایزن خود را کالیبره کنید.
            </div>
          </div>

          {/* ناحیه شمارنده و پالس بصری */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <span className="text-[10px] font-extrabold tracking-widest text-white/40 uppercase">
              {zen.zenTimerType === "focus"
                ? "🎯 زمان تمرکز کایزن فعال است"
                : "🌸 زمان برای بازیابی و استراحت"}
            </span>

            <div className="relative w-72 h-72 flex items-center justify-center">
              <motion.div
                animate={{ scale: zen.isZenTimerRunning ? [1, 1.05, 1] : 1 }}
                transition={{
                  repeat: Infinity,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full border-4 border-teal-500/25 border-dashed"
              />
              <div className="text-6xl font-black font-mono tracking-tight text-teal-350 select-none drop-shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                {Math.floor(zen.zenTimeRemaining / 60)
                  .toString()
                  .padStart(2, "0")}
                <span className="animate-[pulse_1.5s_infinite]">:</span>
                {(zen.zenTimeRemaining % 60).toString().padStart(2, "0")}
              </div>
            </div>

            {/* فرم تنظیم مدت زمان پومودورو */}
            {!zen.isZenTimerRunning && (
              <div
                className="flex flex-col items-center gap-2 pt-1 animate-fadeIn"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback("click");
                    zen.setShowTimeSettings(!zen.showTimeSettings);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-teal-400" />
                  <span>تنظیم زمان تمرکز ({zen.zenFocusDuration} دقیقه)</span>
                </button>

                {zen.showTimeSettings && (
                  <div className="flex flex-col items-center gap-3 bg-slate-900 border border-white/10 p-4 rounded-2xl max-w-xs mt-1 animate-fadeIn shadow-xl">
                    <span className="text-[10px] text-slate-400 font-bold">
                      زمان تمرکز را انتخاب کنید:
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {[10, 15, 25, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            zen.setZenFocusDuration(mins);
                            zen.setZenTimeRemaining(mins * 60);
                            playAudioFeedback("click");
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer ${
                            zen.zenFocusDuration === mins
                              ? "bg-teal-500 text-slate-950 border-teal-400 font-black"
                              : "bg-transparent border-transparent text-slate-400 hover:text-white"
                          }`}
                        >
                          {mins} د
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5 w-full justify-center">
                      <span className="text-[10px] text-slate-400">
                        سفارشی:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={zen.zenFocusDuration}
                        onChange={(e) => {
                          const val = Math.max(
                            1,
                            parseInt(e.target.value) || 25,
                          );
                          zen.setZenFocusDuration(val);
                          zen.setZenTimeRemaining(val * 60);
                        }}
                        className="w-16 px-2.5 py-1 bg-slate-950 border border-white/10 rounded-xl text-center text-xs font-black focus:outline-none focus:border-teal-400 text-teal-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          playAudioFeedback("click");
                          zen.setShowTimeSettings(false);
                        }}
                        className="px-3 py-1 bg-teal-500 text-slate-950 rounded-lg text-[10px] font-black cursor-pointer hover:bg-teal-400 transition-colors"
                      >
                        تایید
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* پخش‌کننده موسیقی ذن */}
            <div
              className="max-w-md w-full mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-3"
              dir="rtl"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                    <Music
                      className={`w-4 h-4 ${zen.isZenAudioPlaying ? "animate-bounce" : ""}`}
                    />
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 block font-bold">
                      موسیقی در حال پخش:
                    </span>
                    <span className="text-xs font-extrabold text-white">
                      {(() => {
                        const activeCat = zen.zenCategories.find(
                          (c) => c.id === zen.zenActiveCatId,
                        );
                        const activeTrack =
                          activeCat?.tracks?.[zen.zenActiveTrackIndex];
                        return activeTrack
                          ? activeTrack.name
                          : "انتخاب نشده / خالی";
                      })()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback("click");
                    zen.setZenAudioLoop((prev) =>
                      prev === "none" ? "one" : prev === "one" ? "all" : "none",
                    );
                  }}
                  className={`text-[9px] font-black px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    zen.zenAudioLoop === "one"
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                      : zen.zenAudioLoop === "all"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                        : "bg-white/5 text-slate-400 border-white/10"
                  }`}
                >
                  {zen.zenAudioLoop === "one"
                    ? "🔂 تکرار تک"
                    : zen.zenAudioLoop === "all"
                      ? "🔁 تکرار لیست"
                      : "➡️ بدون تکرار"}
                </button>
              </div>

              {/* کنترلرهای پخش */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback("click");
                    zen.playPrevZenTrack();
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="آهنگ قبلی"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback("click");
                    zen.setIsZenAudioPlaying(!zen.isZenAudioPlaying);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    zen.isZenAudioPlaying
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/30 animate-pulse"
                      : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {zen.isZenAudioPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 pl-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playAudioFeedback("click");
                    zen.playNextZenTrack();
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="آهنگ بعدی"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
              </div>

              {/* لیست دسته‌ها */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-white/5 w-full">
                {zen.zenCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playAudioFeedback("click");
                      zen.setZenActiveCatId(cat.id);
                      zen.setZenActiveTrackIndex(0);
                    }}
                    className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      zen.zenActiveCatId === cat.id
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* پیوند به تسک فعال */}
            <div className="space-y-2 max-w-sm w-full" dir="rtl">
              <label className="text-[10px] block font-black text-slate-400">
                پیوند تمرکز به تسک کایزن:
              </label>
              <select
                value={zen.zenSelectedTaskId || ""}
                onChange={(e) => {
                  zen.setZenSelectedTaskId(e.target.value || null);
                  playAudioFeedback("click");
                }}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white max-w-xs focus:outline-none focus:ring-1 focus:ring-teal-400 mx-auto cursor-pointer"
              >
                <option
                  value=""
                  className="bg-slate-900 text-white font-medium"
                >
                  -- بدون پیوند به کار معین --
                </option>
                {tasks
                  .filter((t) => t.status !== "done")
                  .map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      className="bg-slate-900 text-white font-semibold"
                    >
                      {t.title}
                    </option>
                  ))}
              </select>
            </div>

            {/* دکمه‌های شروع/توقف و بازنشانی */}
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => {
                  zen.setIsZenTimerRunning(!zen.isZenTimerRunning);
                  playAudioFeedback("click");
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  zen.isZenTimerRunning
                    ? "bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20"
                    : "bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20"
                }`}
              >
                {zen.isZenTimerRunning ? (
                  <Pause className="w-6 h-6 text-slate-950" />
                ) : (
                  <Play className="w-6 h-6 text-slate-950 pl-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  zen.setZenTimeRemaining(zen.zenFocusDuration * 60);
                  zen.setIsZenTimerRunning(false);
                  playAudioFeedback("click");
                  showToast(
                    `تایمر به ${zen.zenFocusDuration} دقیقه بازنشانی شد`,
                    "info",
                  );
                }}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* فوتر پنجره تمرکز */}
          <div
            className="flex items-center justify-between border-t border-white/5 pt-4 text-[10px] text-slate-450"
            dir="rtl"
          >
            <span>گام‌های تفکر عمیق کورتکس سایبان</span>
            <button
              onClick={handleExit}
              className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl font-bold transition-all cursor-pointer"
            >
              خروج از زن تمرکز
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}