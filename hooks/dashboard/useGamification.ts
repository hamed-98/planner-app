// hooks/dashboard/useGamification.ts
import { useState, useCallback } from 'react';
import { calculateLevelData } from '@/lib/utils/brainMath';

interface UseGamificationProps {
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function useGamification({ showToast }: UseGamificationProps) {
  const [xp, setXp] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sayeban_xp');
      return saved ? parseInt(saved, 10) : 150;
    }
    return 150;
  });

  const levelData = calculateLevelData(xp);

  const playAudioFeedback = useCallback((type: string) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      } else if (type === 'done' || type === 'success_check') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      } else if (type === 'xp') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      } else if (type === 'zen_finish') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(261.63, ctx.currentTime);
        osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(392.0, ctx.currentTime + 0.3);
        osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
      } else {
        return;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch {}
  }, []);

  const earnXp = useCallback(
    (amount: number, reason: string) => {
      setXp((prev) => {
        const nextXp = Math.max(0, prev + amount);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sayeban_xp', String(nextXp));
        }
        return nextXp;
      });
      if (amount > 0) {
        playAudioFeedback('xp');
        showToast(`🔥 ${amount}+ امتیاز تجربه (XP) برای ${reason}!`, 'success');
      } else if (amount < 0) {
        showToast(`⚠️ ${Math.abs(amount)}- امتیاز تجربه به دلیل لغو ${reason}`, 'info');
      }
    },
    [playAudioFeedback, showToast]
  );

  const checkAndIncrementAiRequests = useCallback((): boolean => {
    if (typeof window === 'undefined') return true;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const limitSaved = localStorage.getItem('sayeban_ai_daily_limit');
    const currentLimit = limitSaved ? parseInt(limitSaved, 10) : 20;

    const savedUsage = localStorage.getItem('sayeban_ai_usage');
    let usage = { date: todayStr, count: 0 };
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        if (parsed.date === todayStr) usage = parsed;
      } catch {}
    }

    if (usage.count >= currentLimit) {
      showToast(`⚠️ سقف مجاز روزانه شما برای هوش مصنوعی (${currentLimit} درخواست) به پایان رسیده است.`, 'error');
      return false;
    }

    usage.count += 1;
    localStorage.setItem('sayeban_ai_usage', JSON.stringify(usage));
    return true;
  }, [showToast]);

  return {
    xp,
    levelData,
    earnXp,
    playAudioFeedback,
    checkAndIncrementAiRequests,
  };
}