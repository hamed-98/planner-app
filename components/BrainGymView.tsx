'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getBrainProfile,
  saveBrainProfile,
  getCbtRecords,
  addCbtRecord,
  deleteCbtRecord,
  getNeuroHabits,
  saveNeuroHabit,
  getNeuroArticlesGlobal,
  flushBrainGymOfflineQueue,
  DEFAULT_NEURO_ARTICLES,
  DEFAULT_NEURO_HABITS,
  ZERO_BRAIN_PROFILE,
  BrainProfile,
  CbtRecord,
  NeuroHabit,
  AggregatedBrainMetrics,
  getAggregatedBrainMetrics,
} from '../lib/api/brainGym';
import { calculateBrainIndex } from '../lib/utils/brainMath';
import BrainHeader from './brainGym/BrainHeader';
import BrainOverview from './brainGym/overview/BrainOverview';
import SpatialMemoryGame from './brainGym/games/SpatialMemoryGame';
import StroopTestGame from './brainGym/games/StroopTestGame';
import MathSpeedGame from './brainGym/games/MathSpeedGame';
import CbtWizard from './brainGym/cbt/CbtWizard';
import CbtHistory from './brainGym/cbt/CbtHistory';
import NeuroHabitsTab from './brainGym/habits/NeuroHabitsTab';
import NeuroArticlesTab from './brainGym/articles/NeuroArticlesTab';
import CognitiveBadges from './brainGym/overview/CognitiveBadges';

interface BrainGymViewProps {
  useJalaliCalendar: boolean;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

export default function BrainGymView({
  earnXp,
  showToast,
  playAudioFeedback,
}: BrainGymViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'cbt' | 'articles' | 'habits' | 'badges'>('overview');

  // مقداردهی اولیه بدون وقفه از حافظه محلی
  const [brainProfile, setBrainProfile] = useState<BrainProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_brain_profile');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return ZERO_BRAIN_PROFILE;
  });

  const [cbtRecords, setCbtRecords] = useState<CbtRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_cbt_records');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [];
  });

  const [neuroHabits, setNeuroHabits] = useState<NeuroHabit[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_neuro_habits');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return DEFAULT_NEURO_HABITS;
  });

  const [neuroArticles, setNeuroArticles] = useState<any[]>(DEFAULT_NEURO_ARTICLES);

  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedBrainMetrics | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_brain_metrics');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return null;
  });

  const [activeGameId, setActiveGameId] = useState<'spatial' | 'stroop' | 'math' | null>(null);

  const reloadAggregatedMetrics = useCallback(async () => {
    const metrics = await getAggregatedBrainMetrics();
    if (metrics) setAggregatedMetrics(metrics);
  }, []);

  // لود اولیه و استعلام دیتای تازه از سرور در صورت اتصال
  useEffect(() => {
    async function loadBrainData() {
      try {
        
        const [profile, cbts, habits, articles] = await Promise.all([
          getBrainProfile(),
          getCbtRecords(),
          getNeuroHabits(),
          getNeuroArticlesGlobal(),
        ]);
        setBrainProfile(profile);
        setCbtRecords(cbts);
        setNeuroHabits(habits);
        setNeuroArticles(articles);
        await reloadAggregatedMetrics();
      } catch (err) {
        console.warn('[BrainGym] بارگذاری با دیتای آفلاین محلی انجام شد.');
      }
    }
    loadBrainData();
  }, [reloadAggregatedMetrics]);

  // شنود آنی رویداد پایان بازی جهت افزایش فوری آمار در حالت آفلاین
  useEffect(() => {
    const handleBrainUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        if (customEvent.detail.metrics) {
          setAggregatedMetrics(customEvent.detail.metrics);
        }
        if (customEvent.detail.profile) {
          setBrainProfile(customEvent.detail.profile);
        }
      } else {
        try {
          const m = localStorage.getItem('sayeban_brain_metrics');
          if (m) setAggregatedMetrics(JSON.parse(m));
          const p = localStorage.getItem('sayeban_brain_profile');
          if (p) setBrainProfile(JSON.parse(p));
        } catch {}
      }
    };

    window.addEventListener('sayeban_brain_updated', handleBrainUpdate);
    return () => window.removeEventListener('sayeban_brain_updated', handleBrainUpdate);
  }, []);

  // تخلیه خودکار صف با وصل شدن مجدد اینترنت
  // useEffect(() => {
  //   const handleOnline = async () => {
  //     await flushBrainGymOfflineQueue();
  //     await reloadAggregatedMetrics();
  //     showToast('اطلاعات آفلاین باشگاه مغز همگام‌سازی شد.', 'success');
  //   };
  //   window.addEventListener('online', handleOnline);
  //   return () => window.removeEventListener('online', handleOnline);
  // }, [reloadAggregatedMetrics, showToast]);

 const saveProfileHandler = async (updated: BrainProfile) => {
    setBrainProfile(updated);
    try {
      await saveBrainProfile(updated);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await reloadAggregatedMetrics();
      }
    } catch {}
  };

  const handleSaveCbtRecord = async (newRecord: CbtRecord) => {
    setCbtRecords((prev) => [newRecord, ...prev]);
    await addCbtRecord(newRecord);
    showToast('تمرین CBT ذخیره شد (+XP)', 'success');
  };

  const handleDeleteCbtRecord = async (id: string) => {
    setCbtRecords((prev) => prev.filter((r) => r.id !== id));
    await deleteCbtRecord(id);
    showToast('رکورد با موفقیت حذف شد.', 'info');
  };

  const handleToggleHabit = async (id: string) => {
    const target = neuroHabits.find((h) => h.id === id);
    if (!target) return;
    const nextState = !target.completed;
    const updatedHabit = { ...target, completed: nextState };
    setNeuroHabits((prev) => prev.map((h) => (h.id === id ? updatedHabit : h)));

    await saveNeuroHabit(updatedHabit);

    if (nextState) {
      earnXp(updatedHabit.xp, `عادت نورونی: ${updatedHabit.title}`);
      showToast(`عالی بود! +${updatedHabit.xp} XP`, 'success');
      playAudioFeedback?.('done');
    } else {
      earnXp(-updatedHabit.xp, `لغو عادت نورونی: ${updatedHabit.title}`);
      showToast(`عادت لغو شد. -${updatedHabit.xp} XP`, 'info');
    }
  };

  const handleAddCustomHabit = async (title: string) => {
    const newH: NeuroHabit = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'habit_' + Date.now(),
      title,
      completed: false,
      xp: 20,
      isCustom: true,
    };
    setNeuroHabits((prev) => [...prev, newH]);
    await saveNeuroHabit(newH);
    showToast('عادت نورونی جدید ثبت شد!', 'success');
  };

  const completedMissionsCount = neuroHabits.filter((h) => h.completed).length;
  const displayOverallIndex = aggregatedMetrics?.overallIndex ?? calculateBrainIndex(brainProfile);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <BrainHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overallIndex={displayOverallIndex}
        completedMissionsCount={completedMissionsCount}
      />
      {activeTab === 'overview' && (
        <BrainOverview
          brainProfile={brainProfile}
          aggregatedMetrics={aggregatedMetrics}
          cbtRecords={cbtRecords}
          neuroHabits={neuroHabits}
          completedMissionsCount={completedMissionsCount}
          onStartSpatialGame={() => setActiveTab('games')}
        />
      )}
      {activeTab === 'games' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SpatialMemoryGame
            brainProfile={brainProfile}
            saveProfile={saveProfileHandler}
            earnXp={earnXp}
            showToast={showToast}
            playAudioFeedback={playAudioFeedback}
            onGameStart={() => setActiveGameId('spatial')}
            onGameEnd={() => setActiveGameId(null)}
            isOtherGameActive={activeGameId !== null && activeGameId !== 'spatial'}
          />
          <StroopTestGame
            brainProfile={brainProfile}
            saveProfile={saveProfileHandler}
            earnXp={earnXp}
            showToast={showToast}
            playAudioFeedback={playAudioFeedback}
            onGameStart={() => setActiveGameId('stroop')}
            onGameEnd={() => setActiveGameId(null)}
            isOtherGameActive={activeGameId !== null && activeGameId !== 'stroop'}
          />
          <MathSpeedGame
            brainProfile={brainProfile}
            saveProfile={saveProfileHandler}
            earnXp={earnXp}
            showToast={showToast}
            playAudioFeedback={playAudioFeedback}
            onGameStart={() => setActiveGameId('math')}
            onGameEnd={() => setActiveGameId(null)}
            isOtherGameActive={activeGameId !== null && activeGameId !== 'math'}
          />
        </div>
      )}
      {activeTab === 'cbt' && (
        <div className="space-y-6">
          <CbtWizard
            onSaveRecord={handleSaveCbtRecord}
            showToast={showToast}
            earnXp={earnXp}
          />
          <CbtHistory
            records={cbtRecords}
            onDeleteRecord={handleDeleteCbtRecord}
          />
        </div>
      )}
      {activeTab === 'habits' && (
        <NeuroHabitsTab
          habits={neuroHabits}
          onToggleHabit={handleToggleHabit}
          onAddHabit={handleAddCustomHabit}
        />
      )}
      {activeTab === 'articles' && (
        <NeuroArticlesTab articles={neuroArticles} />
      )}
      {activeTab === 'badges' && (
        <CognitiveBadges
          brainProfile={brainProfile}
          cbtRecords={cbtRecords}
          neuroHabits={neuroHabits}
        />
      )}
    </div>
  );
}