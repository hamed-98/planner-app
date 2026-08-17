'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { BrainProfile } from '@/lib/supabase/brainGym';
import { pushWithLimit, calculateStroopInterference } from '@/lib/utils/brainMath';

type StroopMode = 'congruent' | 'incongruent' | 'neutral' | 'mixed';

const STROOP_COLORS = [
  { name: 'قرمز', code: '#ef4444' },
  { name: 'آبی', code: '#3b82f6' },
  { name: 'سبز', code: '#10b981' },
  { name: 'زرد', code: '#eab308' },
  { name: 'بنفش', code: '#8b5cf6' }
];

const NEUTRAL_WORDS = ['صندلی', 'درخت', '★ ستاره', 'کتاب', 'ساعت', '■ مربع'];

interface StroopTestGameProps {
  brainProfile: BrainProfile;
  saveProfile: (updated: BrainProfile) => Promise<void>;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

export default function StroopTestGame({
  brainProfile,
  saveProfile,
  earnXp,
  showToast,
  playAudioFeedback
}: StroopTestGameProps) {
  const [stroopMode, setStroopMode] = useState<StroopMode>('mixed');
  const [stroopScore, setStroopScore] = useState(0);
  const [stroopRound, setStroopRound] = useState(0);
  const [stroopState, setStroopState] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [stroopCurrentWord, setStroopCurrentWord] = useState<{
    text: string;
    colorCode: string;
    correctColorName: string;
    isCongruent: boolean;
  } | null>(null);

  const [stroopCongruentTimes, setStroopCongruentTimes] = useState<number[]>([]);
  const [stroopIncongruentTimes, setStroopIncongruentTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);

  const nextStroopRound = () => {
    let modeToUse = stroopMode;
    if (stroopMode === 'mixed') {
      const rand = Math.random();
      if (rand < 0.35) modeToUse = 'congruent';
      else if (rand < 0.75) modeToUse = 'incongruent';
      else modeToUse = 'neutral';
    }

    let text = '';
    const colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let textIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let isCongruent = false;

    if (modeToUse === 'congruent') {
      text = STROOP_COLORS[colorIdx].name;
      isCongruent = true;
    } else if (modeToUse === 'neutral') {
      text = NEUTRAL_WORDS[Math.floor(Math.random() * NEUTRAL_WORDS.length)];
      isCongruent = false;
    } else {
      while (textIdx === colorIdx) {
        textIdx = Math.floor(Math.random() * STROOP_COLORS.length);
      }
      text = STROOP_COLORS[textIdx].name;
      isCongruent = false;
    }

    setStroopCurrentWord({
      text,
      colorCode: STROOP_COLORS[colorIdx].code,
      correctColorName: STROOP_COLORS[colorIdx].name,
      isCongruent
    });

    startTimeRef.current = Date.now();
  };

  const startStroopGame = () => {
    playAudioFeedback?.('click');
    setStroopScore(0);
    setStroopRound(1);
    setStroopCongruentTimes([]);
    setStroopIncongruentTimes([]);
    setStroopState('playing');
    nextStroopRound();
  };

  const handleStroopAnswer = (selectedColorName: string) => {
    if (!stroopCurrentWord || stroopState !== 'playing') return;

    const reactionMs = Date.now() - startTimeRef.current;
    const isCorrect = selectedColorName === stroopCurrentWord.correctColorName;
    const finalScore = isCorrect ? stroopScore + 1 : stroopScore;

    let updatedCongruent = stroopCongruentTimes;
    let updatedIncongruent = stroopIncongruentTimes;

    if (isCorrect) {
      playAudioFeedback?.('click');
      setStroopScore(finalScore);

      if (stroopCurrentWord.isCongruent) {
        updatedCongruent = [...stroopCongruentTimes, reactionMs];
        setStroopCongruentTimes(updatedCongruent);
      } else {
        updatedIncongruent = [...stroopIncongruentTimes, reactionMs];
        setStroopIncongruentTimes(updatedIncongruent);
      }
    }

    if (stroopRound >= 10) {
      setStroopState('finished');
      playAudioFeedback?.('xp');

      const interferenceEffect = calculateStroopInterference(updatedCongruent, updatedIncongruent);
      const finalEarn = finalScore * 4;
      const accuracyPercent = Math.min(100, Math.round((finalScore / 10) * 100));

      earnXp(finalEarn + 10, 'تکمیل ارزیابی تداخل استروپ');
      showToast(`آزمون پایان یافت! دقت: ${accuracyPercent}٪ | اثر تداخل: ${interferenceEffect}ms. +${finalEarn + 10} XP`, 'success');

      const avgReaction = updatedIncongruent.length > 0
        ? Math.round(updatedIncongruent.reduce((a, b) => a + b, 0) / updatedIncongruent.length)
        : reactionMs;

      saveProfile({
        ...brainProfile,
        flexibilityScore: Math.min(100, Math.max(brainProfile.flexibilityScore, Math.round(finalScore * 10))),
        gamesPlayed: brainProfile.gamesPlayed + 1,
        totalAccuracies: pushWithLimit(brainProfile.totalAccuracies, accuracyPercent),
        reactionTimes: avgReaction > 0 ? pushWithLimit(brainProfile.reactionTimes, avgReaction) : brainProfile.reactionTimes
      });
    } else {
      setStroopRound(prev => prev + 1);
      nextStroopRound();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full font-bold">
            انعطاف شناختی استروپ
          </span>
          {stroopState === 'playing' && (
            <span className="text-xs font-bold text-slate-400">دور {stroopRound} از ۱۰</span>
          )}
        </div>

        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">آزمون استاندارد تداخل استروپ</h3>

        <div>
          <label className="block text-[10px] text-slate-400 mb-1">نوع آزمایش:</label>
          <select
            value={stroopMode}
            onChange={e => setStroopMode(e.target.value as StroopMode)}
            disabled={stroopState === 'playing'}
            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold text-[11px]"
          >
            <option value="mixed">ترکیبی (همخوان + ناهمخوان + خنثی)</option>
            <option value="congruent">همخوان (رنگ و متن یکسان)</option>
            <option value="incongruent">ناهمخوان (رنگ و متن متفاوت - اصلی)</option>
            <option value="neutral">خنثی (اشیا و کلمات غیررنگی)</option>
          </select>
        </div>
      </div>

      <div className="my-4 text-center h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
        {stroopState === 'playing' && stroopCurrentWord ? (
          <motion.div
            key={stroopRound}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black"
            style={{ color: stroopCurrentWord.colorCode }}
          >
            {stroopCurrentWord.text}
          </motion.div>
        ) : stroopState === 'finished' ? (
          <div className="space-y-1">
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">امتیاز: {stroopScore} از ۱۰</div>
            <p className="text-[11px] text-slate-400">شاخص اثر تداخل محاسبه و ثبت گردید.</p>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">برای شروع روی دکمه زیر کلیک کنید.</div>
        )}
      </div>

      {stroopState === 'playing' ? (
        <div className="grid grid-cols-2 gap-2">
          {STROOP_COLORS.map(c => (
            <button
              key={c.name}
              onClick={() => handleStroopAnswer(c.name)}
              className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-extrabold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {c.name}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={startStroopGame}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          {stroopState === 'finished' ? 'شروع مجدد آزمون' : 'شروع چالش استروپ'}
        </button>
      )}
    </div>
  );
}