// hooks/dashboard/useZenSession.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { ZenCategory, ZenAudioLoop } from '@/types/dashboard';

interface UseZenSessionProps {
  earnXp: (amount: number, reason: string) => void;
  playAudioFeedback: (type: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export function useZenSession({ earnXp, playAudioFeedback, showToast }: UseZenSessionProps) {
  const [isZenMode, setIsZenMode] = useState(false);
  const [zenFocusDuration, setZenFocusDuration] = useState(25);
  const [zenBreakDuration, setZenBreakDuration] = useState(5);
  const [zenTimeRemaining, setZenTimeRemaining] = useState(25 * 60);
  const [isZenTimerRunning, setIsZenTimerRunning] = useState(false);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [zenTimerType, setZenTimerType] = useState<'focus' | 'break'>('focus');
  const [zenSelectedTaskId, setZenSelectedTaskId] = useState<string | null>(null);
  const [isZenAudioPlaying, setIsZenAudioPlaying] = useState(false);

  const [zenCategories, setZenCategories] = useState<ZenCategory[]>([]);
  const [zenActiveCatId, setZenActiveCatId] = useState<string | null>(null);
  const [zenActiveTrackIndex, setZenActiveTrackIndex] = useState<number>(0);
  const [zenAudioLoop, setZenAudioLoop] = useState<ZenAudioLoop>('all');
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopZenAmbientAudio = useCallback(() => {
    if (customAudioRef.current) {
      try {
        customAudioRef.current.pause();
        customAudioRef.current.onended = null;
      } catch {}
      customAudioRef.current = null;
    }
  }, []);

  const startZenAmbientAudio = useCallback(
    (catId: string, trackIdx: number) => {
      stopZenAmbientAudio();
      if (typeof window === 'undefined') return;

      const category = zenCategories.find((c) => c.id === catId);
      if (!category?.tracks || category.tracks.length === 0) return;

      const track = category.tracks[trackIdx];
      if (!track?.url) return;

      try {
        const audio = new Audio(track.url);
        audio.volume = 0.5;

        audio.onended = () => {
          if (zenAudioLoop === 'one') {
            startZenAmbientAudio(catId, trackIdx);
          } else if (zenAudioLoop === 'all') {
            const nextIdx = (trackIdx + 1) % category.tracks.length;
            setZenActiveTrackIndex(nextIdx);
            startZenAmbientAudio(catId, nextIdx);
          } else {
            setIsZenAudioPlaying(false);
          }
        };

        audio.play().catch((err) => {
          console.warn('Audio play failed:', err);
        });

        customAudioRef.current = audio;
      } catch (err) {
        console.error('Failed to play focus track:', err);
      }
    },
    [zenCategories, zenAudioLoop, stopZenAmbientAudio]
  );

  const playNextZenTrack = useCallback(() => {
    const category = zenCategories.find((c) => c.id === zenActiveCatId);
    if (!category?.tracks || category.tracks.length === 0) return;
    const nextIdx = (zenActiveTrackIndex + 1) % category.tracks.length;
    setZenActiveTrackIndex(nextIdx);
    if (isZenAudioPlaying && zenActiveCatId) {
      startZenAmbientAudio(zenActiveCatId, nextIdx);
    }
  }, [zenCategories, zenActiveCatId, zenActiveTrackIndex, isZenAudioPlaying, startZenAmbientAudio]);

  const playPrevZenTrack = useCallback(() => {
    const category = zenCategories.find((c) => c.id === zenActiveCatId);
    if (!category?.tracks || category.tracks.length === 0) return;
    const prevIdx = (zenActiveTrackIndex - 1 + category.tracks.length) % category.tracks.length;
    setZenActiveTrackIndex(prevIdx);
    if (isZenAudioPlaying && zenActiveCatId) {
      startZenAmbientAudio(zenActiveCatId, prevIdx);
    }
  }, [zenCategories, zenActiveCatId, zenActiveTrackIndex, isZenAudioPlaying, startZenAmbientAudio]);

  // کنترل ثانیه‌شمار پومودورو
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isZenTimerRunning) {
      interval = setInterval(() => {
        setZenTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsZenTimerRunning(false);
            playAudioFeedback('zen_finish');
            if (zenTimerType === 'focus') {
              const gainedXp = Math.max(10, Math.round(zenFocusDuration));
              earnXp(gainedXp, `تکمیل یک بلوک تمرکز کایزن ${zenFocusDuration} دقیقه‌ای 🧘`);
              showToast('بسیار عالی! زمان تمرکز با موفقیت پایان یافت. کمی استراحت کنید.', 'success');
              setZenTimerType('break');
              return zenBreakDuration * 60;
            } else {
              showToast('زمان استراحت پایان یافت. آماده تمرکز دوباره هستید؟', 'info');
              setZenTimerType('focus');
              return zenFocusDuration * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isZenTimerRunning, zenTimerType, zenFocusDuration, zenBreakDuration, earnXp, playAudioFeedback, showToast]);

  // کنترل پخش صدا
  useEffect(() => {
    if (isZenMode && isZenAudioPlaying && zenActiveCatId) {
      startZenAmbientAudio(zenActiveCatId, zenActiveTrackIndex);
    } else {
      stopZenAmbientAudio();
    }
    return () => {
      stopZenAmbientAudio();
    };
  }, [isZenMode, isZenAudioPlaying, zenActiveCatId, zenActiveTrackIndex, startZenAmbientAudio, stopZenAmbientAudio]);

  return {
    isZenMode,
    setIsZenMode,
    zenFocusDuration,
    setZenFocusDuration,
    zenBreakDuration,
    setZenBreakDuration,
    zenTimeRemaining,
    setZenTimeRemaining,
    isZenTimerRunning,
    setIsZenTimerRunning,
    showTimeSettings,
    setShowTimeSettings,
    zenTimerType,
    setZenTimerType,
    zenSelectedTaskId,
    setZenSelectedTaskId,
    isZenAudioPlaying,
    setIsZenAudioPlaying,
    zenCategories,
    setZenCategories,
    zenActiveCatId,
    setZenActiveCatId,
    zenActiveTrackIndex,
    setZenActiveTrackIndex,
    zenAudioLoop,
    setZenAudioLoop,
    playNextZenTrack,
    playPrevZenTrack,
  };
}