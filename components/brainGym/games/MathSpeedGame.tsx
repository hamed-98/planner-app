'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { BrainProfile, logBrainActivity } from '@/lib/supabase/brainGym';
import { pushWithLimit, calculateMathSpeedScore, calculateAverage } from '@/lib/utils/brainMath';
import { RotateCcw, XCircle } from 'lucide-react';

type MathTimeMode = 'sprint_30' | 'endurance_60' | 'survival_3';
type MathDiffMode = 'basic' | 'advanced' | 'operator_reverse';

interface MathSpeedGameProps {
  brainProfile: BrainProfile;
  saveProfile: (updated: BrainProfile) => Promise<void>;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
  onGameStart?: () => void;
  onGameEnd?: () => void;
  isOtherGameActive?: boolean;
}

export default function MathSpeedGame({
  brainProfile,
  saveProfile,
  earnXp,
  showToast,
  playAudioFeedback,
  onGameStart,
  onGameEnd,
  isOtherGameActive = false
}: MathSpeedGameProps) {
  const [mathTimeMode, setMathTimeMode] = useState<MathTimeMode>('sprint_30');
  const [mathDiffMode, setMathDiffMode] = useState<MathDiffMode>('basic');

  const [mathState, setMathState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [mathScore, setMathScore] = useState(0);
  const [mathMistakes, setMathMistakes] = useState(0);
  const [mathRound, setMathRound] = useState(0);
  const [mathTimer, setMathTimer] = useState(30);
  const [mathLives, setMathLives] = useState(3);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);

  const [mathProblem, setMathProblem] = useState<{
    displayStr: string;
    options: string[];
    correctAnswer: string;
  } | null>(null);

  const startTimeRef = useRef<number>(0);
  const stateRef = useRef({ mathScore, mathMistakes, reactionTimes, brainProfile });
  stateRef.current = { mathScore, mathMistakes, reactionTimes, brainProfile };

  const handleCancelGame = () => {
    setMathState('idle');
    setMathScore(0);
    setMathMistakes(0);
    setReactionTimes([]);
    setMathProblem(null);
    onGameEnd?.();
    showToast('چالش محاسبات متوقف شد.', 'info');
  };

  const finishGame = useCallback((correctCount: number, mistakeCount: number, reactions: number[]) => {
    setMathState('finished');
    onGameEnd?.();
    playAudioFeedback?.('xp');

    const avgReaction = calculateAverage(reactions) || 1500;
    
    // ۱. محاسبه علمی سرعت پردازش مغز (ضربی)
    const { normalizedScore, rawMetrics, isValid } = calculateMathSpeedScore(correctCount, mistakeCount, avgReaction);

    // ۲. فیلتر آزمون غیرمعتبر
    if (!isValid || normalizedScore === null) {
      logBrainActivity('math_speed', rawMetrics, null);
      showToast('⚠️ آزمون به دلیل عدم پاسخ‌دهی کافی یا کلیک غیرواقعی ثبت نشد.', 'error');
      return;
    }

    // ۳. ثبت تلاش در دیتابیس سری زمانی
    logBrainActivity('math_speed', {
      ...rawMetrics,
      time_mode: mathTimeMode,
      diff_mode: mathDiffMode,
      total_questions: correctCount + mistakeCount
    }, normalizedScore);

    // ۴. آپدیت پروفایل کلی
    saveProfile({
      ...stateRef.current.brainProfile,
      processingSpeed: normalizedScore,
      gamesPlayed: (stateRef.current.brainProfile.gamesPlayed || 0) + 1,
      totalAccuracies: pushWithLimit(stateRef.current.brainProfile.totalAccuracies, normalizedScore),
      reactionTimes: avgReaction > 0 ? pushWithLimit(stateRef.current.brainProfile.reactionTimes, avgReaction) : stateRef.current.brainProfile.reactionTimes
    });

    earnXp(Math.max(15, Math.round(normalizedScore / 3)), 'تست سرعت پردازش و محاسبات ذهنی');
    showToast(`پایان تست! امتیاز سرعت پردازش: ${normalizedScore} از ۱۰۰`, 'info');
  }, [earnXp, showToast, saveProfile, playAudioFeedback, mathTimeMode, mathDiffMode, onGameEnd]);

  // ۱. کنترل تایمر صرفاً برای کاهش عدد (بدون فراخوانی finishGame داخل updater)
  useEffect(() => {
    if (mathState !== 'playing' || mathTimeMode === 'survival_3') return;

    const timer = setInterval(() => {
      setMathTimer(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [mathState, mathTimeMode]);

  // ۲. مدیریت اتمام زمان به صورت استاندارد در یک useEffect مجزا (رفع ارور کنسول ری‌اکت)
  useEffect(() => {
    if (mathState === 'playing' && mathTimeMode !== 'survival_3' && mathTimer === 0) {
      finishGame(stateRef.current.mathScore, stateRef.current.mathMistakes, stateRef.current.reactionTimes);
    }
  }, [mathTimer, mathState, mathTimeMode, finishGame]);

  const generateMathProblem = useCallback(() => {
    startTimeRef.current = Date.now();

    if (mathDiffMode === 'operator_reverse') {
      const isOperatorMode = Math.random() > 0.5;
      if (isOperatorMode) {
        const ops = [
          { symbol: '+', fn: (a: number, b: number) => a + b },
          { symbol: '-', fn: (a: number, b: number) => a - b },
          { symbol: '×', fn: (a: number, b: number) => a * b }
        ];
        const selected = ops[Math.floor(Math.random() * ops.length)];
        let a = Math.floor(Math.random() * 12) + 2;
        let b = Math.floor(Math.random() * 10) + 2;
        if (selected.symbol === '-' && a < b) [a, b] = [b, a];
        const res = selected.fn(a, b);

        setMathProblem({
          displayStr: `${a}  ❓  ${b} = ${res}`,
          options: ['+', '-', '×', '÷'],
          correctAnswer: selected.symbol
        });
      } else {
        const b = Math.floor(Math.random() * 8) + 2;
        const res = Math.floor(Math.random() * 9) + 2;
        const a = b * res;

        const optionsSet = new Set<string>();
        optionsSet.add(String(b));
        while (optionsSet.size < 4) {
          const wrong = Math.max(1, b + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1));
          optionsSet.add(String(wrong));
        }

        setMathProblem({
          displayStr: `${a} ÷ ❓ = ${res}`,
          options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
          correctAnswer: String(b)
        });
      }
    } else if (mathDiffMode === 'advanced') {
      const ops = ['+', '-', '×', '÷'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let n1 = Math.floor(Math.random() * 25) + 2;
      let n2 = Math.floor(Math.random() * 15) + 2;
      let ans = 0;

      if (op === '+') ans = n1 + n2;
      else if (op === '-') {
        if (n1 < n2) [n1, n2] = [n2, n1];
        ans = n1 - n2;
      } else if (op === '×') {
        n1 = Math.floor(Math.random() * 12) + 2;
        n2 = Math.floor(Math.random() * 9) + 2;
        ans = n1 * n2;
      } else {
        n2 = Math.floor(Math.random() * 9) + 2;
        ans = Math.floor(Math.random() * 9) + 2;
        n1 = n2 * ans;
      }

      const opts = new Set<string>();
      opts.add(String(ans));
      while (opts.size < 4) {
        const offset = (Math.floor(Math.random() * 6) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const wrong = ans + offset;
        if (wrong >= 0 && wrong !== ans) opts.add(String(wrong));
      }

      setMathProblem({
        displayStr: `${n1} ${op} ${n2} = ?`,
        options: Array.from(opts).sort(() => Math.random() - 0.5),
        correctAnswer: String(ans)
      });
    } else {
      const op = Math.random() > 0.5 ? '+' : '-';
      let n1 = Math.floor(Math.random() * 30) + 5;
      let n2 = Math.floor(Math.random() * 25) + 2;
      if (op === '-' && n1 < n2) [n1, n2] = [n2, n1];
      const ans = op === '+' ? n1 + n2 : n1 - n2;

      const opts = new Set<string>();
      opts.add(String(ans));
      while (opts.size < 4) {
        const offset = (Math.floor(Math.random() * 6) + 1) * (Math.random() > 0.5 ? 1 : -1);
        const wrong = ans + offset;
        if (wrong >= 0 && wrong !== ans) opts.add(String(wrong));
      }

      setMathProblem({
        displayStr: `${n1} ${op} ${n2} = ?`,
        options: Array.from(opts).sort(() => Math.random() - 0.5),
        correctAnswer: String(ans)
      });
    }
  }, [mathDiffMode]);

  const startMathGame = () => {
    if (isOtherGameActive) return;
    playAudioFeedback?.('click');
    onGameStart?.();
    setMathScore(0);
    setMathMistakes(0);
    setReactionTimes([]);
    setMathRound(1);
    setMathLives(3);
    setMathTimer(mathTimeMode === 'sprint_30' ? 30 : mathTimeMode === 'endurance_60' ? 60 : 999);
    setMathState('playing');
    generateMathProblem();
  };

  const handleMathAnswer = (val: string) => {
    if (!mathProblem || mathState !== 'playing') return;

    const reactionMs = Date.now() - startTimeRef.current;
    const updatedReactions = [...reactionTimes, reactionMs];
    setReactionTimes(updatedReactions);

    if (val === mathProblem.correctAnswer) {
      playAudioFeedback?.('click');
      setMathScore(prev => prev + 1);
    } else {
      playAudioFeedback?.('click');
      const updatedMistakes = mathMistakes + 1;
      setMathMistakes(updatedMistakes);

      if (mathTimeMode === 'survival_3') {
        const remaining = mathLives - 1;
        setMathLives(remaining);
        if (remaining <= 0) {
          finishGame(mathScore, updatedMistakes, updatedReactions);
          return;
        }
      }
    }

    setMathRound(prev => prev + 1);
    generateMathProblem();
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
            سرعت پردازش
          </span>
          {mathState === 'playing' ? (
            <button
              type="button"
              onClick={handleCancelGame}
              className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>انصراف</span>
            </button>
          ) : (
            <span className="text-xs font-bold text-slate-400">
              {mathTimeMode === 'survival_3' ? `❤️ ۳ جان` : `⏱️ ${mathTimeMode === 'sprint_30' ? '۳۰s' : '۶۰s'}`}
            </span>
          )}
        </div>

        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">تست سرعت و محاسبات معکوس</h3>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">حالت زمانی:</label>
            <select
              value={mathTimeMode}
              onChange={e => setMathTimeMode(e.target.value as MathTimeMode)}
              disabled={mathState === 'playing' || isOtherGameActive}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold disabled:opacity-50"
            >
              <option value="sprint_30">۳۰ ثانیه سریع</option>
              <option value="endurance_60">۶۰ ثانیه پایدار</option>
              <option value="survival_3">حالت بقا (۳ جان)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">نوع مسئله:</label>
            <select
              value={mathDiffMode}
              onChange={e => setMathDiffMode(e.target.value as MathDiffMode)}
              disabled={mathState === 'playing' || isOtherGameActive}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold disabled:opacity-50"
            >
              <option value="basic">جمع و تفریق</option>
              <option value="advanced">ضرب و تقسیم پیشرفته</option>
              <option value="operator_reverse">کشف عملگر و مجهول ❓</option>
            </select>
          </div>
        </div>
      </div>

      <div className="my-4 text-center h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
        {mathState === 'playing' && mathProblem ? (
          <div className="space-y-1">
            <motion.div key={mathRound} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {mathProblem.displayStr}
            </motion.div>
            <div className="text-[10px] text-amber-500 font-mono font-bold">
              {mathTimeMode !== 'survival_3' ? `⏱️ ${mathTimer} ثانیه باقی‌مانده` : `❤️ ${mathLives} جان باقی‌مانده`}
            </div>
          </div>
        ) : mathState === 'finished' ? (
          <div className="space-y-1">
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">پاسخ‌های صحیح: {mathScore}</div>
            <p className="text-[11px] text-slate-400">شاخص سرعت پردازش عصبی محاسبه و در دیتابیس ثبت شد.</p>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">برای شروع روی دکمه زیر کلیک کنید.</div>
        )}
      </div>

      {mathState === 'playing' && mathProblem ? (
        <div className="grid grid-cols-2 gap-2">
          {mathProblem.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleMathAnswer(opt)}
              className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-black font-mono hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={startMathGame}
          disabled={isOtherGameActive}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          {isOtherGameActive 
            ? 'یک بازی دیگر در جریان است' 
            : (mathState === 'finished' ? 'تلاش مجدد' : 'شروع تست سرعت')}
        </button>
      )}
    </div>
  );
}