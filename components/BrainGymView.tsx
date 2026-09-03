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
  DEFAULT_NEURO_ARTICLES,
  DEFAULT_NEURO_HABITS,
  ZERO_BRAIN_PROFILE,
  BrainProfile,
  CbtRecord,
  NeuroHabit,
  AggregatedBrainMetrics,
  getAggregatedBrainMetrics
} from '../lib/supabase/brainGym';
import { calculateBrainIndex } from '../lib/utils/brainMath';

// کامپوننت‌های تفکیک‌شده
import BrainHeader from './brainGym/BrainHeader';
import BrainOverview from './brainGym/overview/BrainOverview';
import SpatialMemoryGame from './brainGym/games/SpatialMemoryGame';
import StroopTestGame from './brainGym/games/StroopTestGame';
import MathSpeedGame from './brainGym/games/MathSpeedGame';
import CbtWizard from './brainGym/cbt/CbtWizard';
import CbtHistory from './brainGym/cbt/CbtHistory';
import NeuroHabitsTab from './brainGym/habits/NeuroHabitsTab';
import NeuroArticlesTab from './brainGym/articles/NeuroArticlesTab';

interface BrainGymViewProps {
  useJalaliCalendar: boolean;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

export default function BrainGymView({
  earnXp,
  showToast,
  playAudioFeedback
}: BrainGymViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'cbt' | 'articles' | 'habits'>('overview');
  const [brainProfile, setBrainProfile] = useState<BrainProfile>(ZERO_BRAIN_PROFILE);
  const [cbtRecords, setCbtRecords] = useState<CbtRecord[]>([]);
  const [neuroHabits, setNeuroHabits] = useState<NeuroHabit[]>(DEFAULT_NEURO_HABITS);
  const [neuroArticles, setNeuroArticles] = useState<any[]>(DEFAULT_NEURO_ARTICLES);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedBrainMetrics | null>(null);

  // رهگیری بازی فعال برای جلوگیری از شروع همزمان
  const [activeGameId, setActiveGameId] = useState<'spatial' | 'stroop' | 'math' | null>(null);

  const reloadAggregatedMetrics = useCallback(async () => {
    const metrics = await getAggregatedBrainMetrics();
    setAggregatedMetrics(metrics);
  }, []);

  useEffect(() => {
    async function loadBrainData() {
      try {
        const [profile, cbts, habits, articles] = await Promise.all([
          getBrainProfile(),
          getCbtRecords(),
          getNeuroHabits(),
          getNeuroArticlesGlobal()
        ]);

        setBrainProfile(profile);
        setCbtRecords(cbts);
        setNeuroHabits(habits);
        setNeuroArticles(articles);
        await reloadAggregatedMetrics();
      } catch (err) {
        console.error('Failed loading Brain Gym data:', err);
      }
    }
    loadBrainData();
  }, [reloadAggregatedMetrics]);

  const saveProfileHandler = async (updated: BrainProfile) => {
    setBrainProfile(updated);
    try {
      await saveBrainProfile(updated);
      await reloadAggregatedMetrics();
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره پروفایل', 'error');
    }
  };

  const handleSaveCbtRecord = async (newRecord: CbtRecord) => {
    setCbtRecords(prev => [newRecord, ...prev]);
    try {
      await addCbtRecord(newRecord);
      showToast('چرخه CBT با موفقیت ذخیره شد! +۳۵ XP', 'success');
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره CBT', 'error');
    }
  };

  const handleDeleteCbtRecord = async (id: string) => {
    setCbtRecords(prev => prev.filter(r => r.id !== id));
    try {
      await deleteCbtRecord(id);
      showToast('پیشینه مورد نظر حذف گردید.', 'info');
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف پیشینه', 'error');
    }
  };

  const handleToggleHabit = async (id: string) => {
    const target = neuroHabits.find(h => h.id === id);
    if (!target) return;

    const nextState = !target.completed;
    const updatedHabit = { ...target, completed: nextState };

    setNeuroHabits(prev => prev.map(h => (h.id === id ? updatedHabit : h)));

    try {
      await saveNeuroHabit(updatedHabit);

      if (nextState) {
        earnXp(updatedHabit.xp, `ماموریت نورون‌سازی: ${updatedHabit.title}`);
        showToast(`ماموریت انجام شد! +${updatedHabit.xp} XP`, 'success');
        playAudioFeedback?.('done');
      } else {
        earnXp(-updatedHabit.xp, `لغو ماموریت: ${updatedHabit.title}`);
        showToast(`ماموریت لغو شد. -${updatedHabit.xp} XP`, 'info');
      }
    } catch (e: any) {
      setNeuroHabits(prev => prev.map(h => (h.id === id ? target : h)));
      showToast(e.message || 'خطا در ذخیره ماموریت', 'error');
    }
  };

  const handleAddCustomHabit = async (title: string) => {
    const newH: NeuroHabit = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'habit_' + Date.now(),
      title,
      completed: false,
      xp: 20,
      isCustom: true
    };

    setNeuroHabits(prev => [...prev, newH]);
    try {
      await saveNeuroHabit(newH);
      showToast('عادت مغزی جدید ذخیره شد!', 'success');
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره عادت', 'error');
    }
  };

  const completedMissionsCount = neuroHabits.filter(h => h.completed).length;
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
    </div>
  );
}