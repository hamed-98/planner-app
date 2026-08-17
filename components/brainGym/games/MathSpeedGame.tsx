'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { BrainProfile } from '@/lib/supabase/brainGym';
import { pushWithLimit } from '@/lib/utils/brainMath';

type MathTimeMode = 'sprint_30' | 'endurance_60' | 'survival_3';
type MathDiffMode = 'basic' | 'advanced' | 'operator_reverse';

interface MathSpeedGameProps {
  brainProfile: BrainProfile;
  saveProfile: (updated: BrainProfile) => Promise<void>;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

export default function MathSpeedGame({
  brainProfile,
  saveProfile,
  earnXp,
  showToast,
  playAudioFeedback
}: MathSpeedGameProps) {
  const [mathTimeMode, setMathTimeMode] = useState<MathTimeMode>('sprint_30');
  const [mathDiffMode, setMathDiffMode] = useState<MathDiffMode>('basic');

  const [mathState, setMathState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [mathScore, setMathScore] = useState(0);
  const [mathRound, setMathRound] = useState(0);
  const [mathTimer, setMathTimer] = useState(30);
  const [mathLives, setMathLives] = useState(3);

  const [mathProblem, setMathProblem] = useState<{
    displayStr: string;
    options: string[];
    correctAnswer: string;
  } | null>(null);

  const stateRef = useRef({ mathScore, mathRound, brainProfile });
  stateRef.current = { mathScore, mathRound, brainProfile };

  const finishGame = useCallback((scoreVal: number, roundsVal: number) => {
    setMathState('finished');
    playAudioFeedback?.('xp');

    const attempts = Math.max(1, roundsVal);
    const mathAccuracy = Math.min(100, Math.round((scoreVal / attempts) * 100));

    earnXp(scoreVal * 3 + 10, 'تست سرعت پردازش و محاسبات ذهنی');
    showToast(`پایان تست! پاسخ‌های درست: ${scoreVal} | دقت: ${mathAccuracy}٪`, 'info');

    saveProfile({
      ...stateRef.current.brainProfile,
      processingSpeed: Math.min(100, Math.max(stateRef.current.brainProfile.processingSpeed, Math.round(scoreVal * 3))),
      gamesPlayed: stateRef.current.brainProfile.gamesPlayed + 1,
      totalAccuracies: pushWithLimit(stateRef.current.brainProfile.totalAccuracies, mathAccuracy)
    });
  }, [earnXp, showToast, saveProfile, playAudioFeedback]);

  useEffect(() => {
    if (mathState !== 'playing' || mathTimeMode === 'survival_3') return;

    const timer = setInterval(() => {
      setMathTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishGame(stateRef.current.mathScore, stateRef.current.mathRound);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mathState, mathTimeMode, finishGame]);

  const generateMathProblem = useCallback(() => {
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
    playAudioFeedback?.('click');
    setMathScore(0);
    setMathRound(1);
    setMathLives(3);
    setMathTimer(mathTimeMode === 'sprint_30' ? 30 : mathTimeMode === 'endurance_60' ? 60 : 999);
    setMathState('playing');
    generateMathProblem();
  };

  const handleMathAnswer = (val: string) => {
    if (!mathProblem || mathState !== 'playing') return;

    if (val === mathProblem.correctAnswer) {
      playAudioFeedback?.('click');
      setMathScore(prev => prev + 1);
    } else {
      playAudioFeedback?.('click');
      if (mathTimeMode === 'survival_3') {
        const remaining = mathLives - 1;
        setMathLives(remaining);
        if (remaining <= 0) {
          finishGame(mathScore, mathRound);
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
          {mathState === 'playing' && mathTimeMode !== 'survival_3' && (
            <span className="text-xs font-bold text-amber-600 font-mono">⏱️ {mathTimer}s</span>
          )}
          {mathState === 'playing' && mathTimeMode === 'survival_3' && (
            <span className="text-xs font-bold text-rose-500">❤️ {mathLives} جان</span>
          )}
        </div>

        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">تست سرعت و محاسبات معکوس</h3>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">حالت زمانی:</label>
            <select
              value={mathTimeMode}
              onChange={e => setMathTimeMode(e.target.value as MathTimeMode)}
              disabled={mathState === 'playing'}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
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
              disabled={mathState === 'playing'}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
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
          <motion.div key={mathRound} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {mathProblem.displayStr}
          </motion.div>
        ) : mathState === 'finished' ? (
          <div className="space-y-1">
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">پاسخ صحیح: {mathScore}</div>
            <p className="text-[11px] text-slate-400">سرعت پردازش عصبی به‌روزرسانی شد.</p>
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
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          {mathState === 'finished' ? 'تلاش مجدد' : 'شروع تست سرعت'}
        </button>
      )}
    </div>
  );
}