'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BrainProfile } from '@/lib/supabase/brainGym';
import { pushWithLimit } from '@/lib/utils/brainMath';

type SpatialDifficulty = 'easy' | 'medium' | 'hard' | 'advanced';
type SpatialMode = 'normal' | 'reverse';

interface SpatialMemoryGameProps {
  brainProfile: BrainProfile;
  saveProfile: (updated: BrainProfile) => Promise<void>;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

export default function SpatialMemoryGame({
  brainProfile,
  saveProfile,
  earnXp,
  showToast,
  playAudioFeedback
}: SpatialMemoryGameProps) {
  const [spatialDifficulty, setSpatialDifficulty] = useState<SpatialDifficulty>('easy');
  const [spatialMode, setSpatialMode] = useState<SpatialMode>('normal');
  const [spatialLevel, setSpatialLevel] = useState(1);
  const [spatialSequence, setSpatialSequence] = useState<number[]>([]);
  const [spatialUserSeq, setSpatialUserSeq] = useState<number[]>([]);
  const [spatialGameState, setSpatialGameState] = useState<'idle' | 'showing' | 'user_turn' | 'success' | 'failed'>('idle');
  const [spatialActiveTile, setSpatialActiveTile] = useState<number | null>(null);

  const [spatialReactionTimes, setSpatialReactionTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  const getGridConfig = (diff: SpatialDifficulty) => {
    switch (diff) {
      case 'easy': return { size: 9, cols: 3, length: 3, speed: 700 };
      case 'medium': return { size: 9, cols: 3, length: 4, speed: 550 };
      case 'hard': return { size: 16, cols: 4, length: 6, speed: 450 };
      case 'advanced': return { size: 25, cols: 5, length: 8, speed: 320 };
    }
  };

  const generateSpatialSequence = useCallback((lvl: number) => {
    clearAllTimeouts();
    const config = getGridConfig(spatialDifficulty);
    const seqLength = config.length + (lvl - 1);
    const seq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      seq.push(Math.floor(Math.random() * config.size));
    }

    setSpatialSequence(seq);
    setSpatialUserSeq([]);
    setSpatialGameState('showing');

    seq.forEach((tileIdx, step) => {
      const showTimer = setTimeout(() => {
        setSpatialActiveTile(tileIdx);
        playAudioFeedback?.('click');
        const hideTimer = setTimeout(() => setSpatialActiveTile(null), config.speed * 0.6);
        timeoutsRef.current.push(hideTimer);
      }, (step + 1) * config.speed);
      timeoutsRef.current.push(showTimer);
    });

    const turnTimer = setTimeout(() => {
      setSpatialGameState('user_turn');
      startTimeRef.current = Date.now();
    }, (seqLength + 1) * config.speed);
    timeoutsRef.current.push(turnTimer);
  }, [spatialDifficulty, playAudioFeedback, clearAllTimeouts]);

  const startSpatialGame = () => {
    playAudioFeedback?.('click');
    setSpatialLevel(1);
    setSpatialReactionTimes([]);
    generateSpatialSequence(1);
  };

  const handleSpatialTileClick = (index: number) => {
    if (spatialGameState !== 'user_turn') return;
    playAudioFeedback?.('click');

    const reactionMs = Date.now() - startTimeRef.current;
    startTimeRef.current = Date.now();
    setSpatialReactionTimes(prev => [...prev, reactionMs]);

    const nextUserSeq = [...spatialUserSeq, index];
    setSpatialUserSeq(nextUserSeq);

    const targetSeq = spatialMode === 'reverse' ? [...spatialSequence].reverse() : spatialSequence;
    const currentStep = nextUserSeq.length - 1;

    if (nextUserSeq[currentStep] !== targetSeq[currentStep]) {
      setSpatialGameState('failed');
      showToast('اشتباه بود! الگوی حافظه قطع شد.', 'error');

      const completedSteps = Math.max(0, spatialLevel - 1);
      const partialAcc = Math.round((completedSteps / 4) * 100);
      const avgReaction = spatialReactionTimes.length > 0
        ? Math.round(spatialReactionTimes.reduce((a, b) => a + b, 0) / spatialReactionTimes.length)
        : 500;

      saveProfile({
        ...brainProfile,
        gamesPlayed: brainProfile.gamesPlayed + 1,
        totalAccuracies: pushWithLimit(brainProfile.totalAccuracies, partialAcc),
        reactionTimes: avgReaction > 0 ? pushWithLimit(brainProfile.reactionTimes, avgReaction) : brainProfile.reactionTimes
      });
      return;
    }

    if (nextUserSeq.length === targetSeq.length) {
      if (spatialLevel >= 4) {
        setSpatialGameState('success');
        playAudioFeedback?.('xp');

        const avgReaction = spatialReactionTimes.length > 0
          ? Math.round(spatialReactionTimes.reduce((a, b) => a + b, 0) / spatialReactionTimes.length)
          : 450;

        earnXp(40, `تکمیل چالش حافظه فضایی (${spatialDifficulty} - ${spatialMode})`);
        showToast(`آفرین! سطح با موفقیت طی شد. میانگین واکنش: ${avgReaction}ms. +۴۰ XP`, 'success');

        saveProfile({
          ...brainProfile,
          memoryScore: Math.min(100, brainProfile.memoryScore + 4),
          gamesPlayed: brainProfile.gamesPlayed + 1,
          totalAccuracies: pushWithLimit(brainProfile.totalAccuracies, 100),
          reactionTimes: pushWithLimit(brainProfile.reactionTimes, avgReaction)
        });
      } else {
        const nextLvl = spatialLevel + 1;
        setSpatialLevel(nextLvl);
        showToast(`مرحله ${spatialLevel} با موفقیت کامل شد! مرحله بعد...`, 'info');
        const nextTimer = setTimeout(() => generateSpatialSequence(nextLvl), 800);
        timeoutsRef.current.push(nextTimer);
      }
    }
  };

  const cfg = getGridConfig(spatialDifficulty);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-bold">
            حافظه فضایی
          </span>
          <span className="text-xs font-bold text-slate-400">سطح {spatialLevel}</span>
        </div>

        <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">چالش الگوی فضایی مغز</h3>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">سطح دشواری:</label>
            <select
              value={spatialDifficulty}
              onChange={e => setSpatialDifficulty(e.target.value as SpatialDifficulty)}
              disabled={spatialGameState !== 'idle'}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="easy">آسان (۳×۳ - ۳ الگو)</option>
              <option value="medium">متوسط (۳×۳ - ۴ الگو)</option>
              <option value="hard">سخت (۴×۴ - ۶ الگو)</option>
              <option value="advanced">پیشرفته (۵×۵ - ۸ الگو)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">حالت بازی:</label>
            <select
              value={spatialMode}
              onChange={e => setSpatialMode(e.target.value as SpatialMode)}
              disabled={spatialGameState !== 'idle'}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
            >
              <option value="normal">ترتیب مستقیم</option>
              <option value="reverse">الگوی معکوس 🔄</option>
            </select>
          </div>
        </div>
      </div>

      <div
        className="grid gap-2 my-4 mx-auto w-full max-w-[240px]"
        style={{ gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cfg.size }).map((_, idx) => (
          <button
            key={idx}
            disabled={spatialGameState !== 'user_turn'}
            onClick={() => handleSpatialTileClick(idx)}
            className={`h-12 rounded-xl border-2 transition-all cursor-pointer ${
              spatialActiveTile === idx
                ? 'bg-purple-500 border-purple-400 scale-105 shadow-md shadow-purple-500/50'
                : spatialUserSeq.includes(idx) && spatialGameState === 'user_turn'
                ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-300'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-purple-300'
            }`}
          />
        ))}
      </div>

      <div>
        {spatialGameState === 'idle' && (
          <button
            onClick={startSpatialGame}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
          >
            شروع چالش حافظه
          </button>
        )}
        {spatialGameState === 'showing' && (
          <div className="text-center text-xs font-bold text-purple-600 dark:text-purple-400 animate-pulse py-2">
            دقت کنید! در حال نمایش الگو...
          </div>
        )}
        {spatialGameState === 'user_turn' && (
          <div className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 py-2">
            {spatialMode === 'reverse' ? 'الگو را برعکس تکرار کنید!' : 'نوبت شماست! الگو را تکرار کنید'} ({spatialUserSeq.length} از {spatialSequence.length})
          </div>
        )}
        {(spatialGameState === 'success' || spatialGameState === 'failed') && (
          <button
            onClick={startSpatialGame}
            className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
          >
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  );
}