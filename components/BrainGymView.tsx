/* eslint-disable react-hooks/purity */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Brain,
  Zap,
  Sparkles,
  Activity,
  Award,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Target,
  Play,
  Check,
  Flame,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Feather,
  ShieldAlert,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dna,
  Layers,
  Star,
  Plus,
  HeartHandshake,
  AlertTriangle,
  Smile,
  Timer,
  Sliders,
  Maximize2,
  Trash2,
  Loader2
} from 'lucide-react';
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
  NeuroHabit
} from '../lib/supabase/brainGym';

interface BrainGymViewProps {
  useJalaliCalendar: boolean;
  earnXp: (amount: number, reason: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  playAudioFeedback?: (type: 'click' | 'done' | 'xp' | 'zen_finish') => void;
}

// Cognitive Distortions List
const COGNITIVE_DISTORTIONS = [
  { id: 'all_or_nothing', name: 'تفکر همه یا هیچ (All-or-Nothing)', desc: 'دیدن امور به صورت کاملاً سیاه یا سفید بدون در نظر گرفتن طیف خاکستری.' },
  { id: 'catastrophizing', name: 'فاجعه‌سازی (Catastrophizing)', desc: 'پیش‌بینی بدترین سناریوی ممکن و بزرگ‌نمایی خطرات.' },
  { id: 'mind_reading', name: 'ذهن‌خوانی (Mind Reading)', desc: 'فرض بر اینکه می‌دانید دیگران چه فکری در مورد شما می‌کنند بدون داشتن مدرک.' },
  { id: 'should_statements', name: 'جملات «باید»دار (Should Statements)', desc: 'سرزنش خود یا دیگران با انتظارات سخت‌گیرانه غیرواقعی.' },
  { id: 'personalization', name: 'شخصی‌سازی (Personalization)', desc: 'مسئول دانستن خود برای رویدادهایی که کنترل کامل روی آن‌ها ندارید.' },
  { id: 'labeling', name: 'برچسب‌زنی (Labeling)', desc: 'نسبت دادن یک صفت منفی کلی به خود یا دیگران به خاطر یک اشتباه.' },
  { id: 'negative_filtering', name: 'فیلتر منفی (Negative Filtering)', desc: 'تمرکز روی یک نقطه منفی کوچک و نادیده گرفتن تمام نکات مثبت.' },
  { id: 'fortune_telling', name: 'پیش‌گویی منفی (Fortune Telling)', desc: 'پیش‌بینی منفی آینده به عنوان یک واقعیت حتمی.' }
];

// Crisis Keywords for CBT Safety Guard
const CRISIS_KEYWORDS = [
  'خودکشی', 'میخوام بمیرم', 'می‌خوام بمیرم', 'خودم رو بکشم', 'خودم را بکشم',
  'آسیب بزنم', 'نمیخوام زنده باشم', 'نمی‌خواهم زنده باشم', 'پایان زندگی', 'خاتمه زندگی', 'بی‌ارزشی شدید'
];

export default function BrainGymView({
  useJalaliCalendar,
  earnXp,
  showToast,
  playAudioFeedback
}: BrainGymViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'cbt' | 'articles' | 'habits'>('overview');
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);

  // --- BRAIN PROFILE & DYNAMIC STATS ---
  const [brainProfile, setBrainProfile] = useState<BrainProfile>(ZERO_BRAIN_PROFILE);
  const [cbtRecords, setCbtRecords] = useState<CbtRecord[]>([]);
  const [neuroHabits, setNeuroHabits] = useState<NeuroHabit[]>(DEFAULT_NEURO_HABITS);
  const [neuroArticles, setNeuroArticles] = useState<any[]>(DEFAULT_NEURO_ARTICLES);

  // Fetch initial state from Supabase
  useEffect(() => {
    async function loadBrainData() {
      setIsLoadingSupabase(true);
      try {
        const profile = await getBrainProfile();
        setBrainProfile(profile);

        const cbts = await getCbtRecords();
        setCbtRecords(cbts);

        const habits = await getNeuroHabits();
        setNeuroHabits(habits);

        const articles = await getNeuroArticlesGlobal();
        setNeuroArticles(articles);
      } catch (err) {
        console.error('Failed loading Brain Gym data:', err);
      } finally {
        setIsLoadingSupabase(false);
      }
    }
    loadBrainData();
  }, []);

  const saveProfile = async (updated: BrainProfile) => {
    setBrainProfile(updated);
    try {
      await saveBrainProfile(updated);
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره پروفایل', 'error');
    }
  };

  const handleResetBrainProfile = async () => {
    if (typeof window !== 'undefined') {
      const confirmReset = window.confirm('آیا از صفر کردن و بازنشانی کامل تمام آمارهای شناختی خود مطمئن هستید؟');
      if (!confirmReset) return;
    }
    setBrainProfile(ZERO_BRAIN_PROFILE);
    await saveBrainProfile(ZERO_BRAIN_PROFILE);
    showToast('آمارهای شناختی شما با موفقیت صفر گردید.', 'info');
  };

  // Calculate real average stats (returns 0 for new users with no games)
  const avgAccuracy = brainProfile.totalAccuracies.length > 0
    ? Math.round(brainProfile.totalAccuracies.reduce((a, b) => a + b, 0) / brainProfile.totalAccuracies.length)
    : 0;

  const avgReactionMs = brainProfile.reactionTimes.length > 0
    ? Math.round(brainProfile.reactionTimes.reduce((a, b) => a + b, 0) / brainProfile.reactionTimes.length)
    : 0;

  const overallIndex = brainProfile.gamesPlayed > 0
    ? Math.round((brainProfile.memoryScore + brainProfile.flexibilityScore + brainProfile.processingSpeed + brainProfile.focusEnergy) / 4)
    : 0;

  // ----------------------------------------------------------------------
  // GAME 1: SPATIAL PATTERN MEMORY (حافظه فضایی)
  // ----------------------------------------------------------------------
  type SpatialDifficulty = 'easy' | 'medium' | 'hard' | 'advanced';
  type SpatialMode = 'normal' | 'reverse';

  const [spatialDifficulty, setSpatialDifficulty] = useState<SpatialDifficulty>('easy');
  const [spatialMode, setSpatialMode] = useState<SpatialMode>('normal');
  const [spatialLevel, setSpatialLevel] = useState(1);
  const [spatialSequence, setSpatialSequence] = useState<number[]>([]);
  const [spatialUserSeq, setSpatialUserSeq] = useState<number[]>([]);
  const [spatialGameState, setSpatialGameState] = useState<'idle' | 'showing' | 'user_turn' | 'success' | 'failed'>('idle');
  const [spatialActiveTile, setSpatialActiveTile] = useState<number | null>(null);
  
  // Performance metrics for current game session
  const [spatialStartTime, setSpatialStartTime] = useState<number>(0);
  const [spatialReactionTimes, setSpatialReactionTimes] = useState<number[]>([]);
  const [spatialFaultlessStreak, setSpatialFaultlessStreak] = useState(0);

  const getGridConfig = (diff: SpatialDifficulty) => {
    switch (diff) {
      case 'easy': return { size: 9, cols: 3, length: 3, speed: 700 };
      case 'medium': return { size: 9, cols: 3, length: 4, speed: 550 };
      case 'hard': return { size: 16, cols: 4, length: 6, speed: 450 };
      case 'advanced': return { size: 25, cols: 5, length: 8, speed: 320 };
    }
  };

  const startSpatialGame = () => {
    if (playAudioFeedback) playAudioFeedback('click');
    setSpatialLevel(1);
    setSpatialFaultlessStreak(0);
    setSpatialReactionTimes([]);
    generateSpatialSequence(1);
  };

  const generateSpatialSequence = (lvl: number) => {
    const config = getGridConfig(spatialDifficulty);
    const seqLength = config.length + (lvl - 1);
    const seq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      seq.push(Math.floor(Math.random() * config.size));
    }

    setSpatialSequence(seq);
    setSpatialUserSeq([]);
    setSpatialGameState('showing');

    // Display sequence
    seq.forEach((tileIdx, step) => {
      setTimeout(() => {
        setSpatialActiveTile(tileIdx);
        if (playAudioFeedback) playAudioFeedback('click');
        setTimeout(() => setSpatialActiveTile(null), config.speed * 0.6);
      }, (step + 1) * config.speed);
    });

    setTimeout(() => {
      setSpatialGameState('user_turn');
      setSpatialStartTime(Date.now());
    }, (seqLength + 1) * config.speed);
  };

  const handleSpatialTileClick = (index: number) => {
    if (spatialGameState !== 'user_turn') return;
    if (playAudioFeedback) playAudioFeedback('click');

    const reactionMs = Date.now() - spatialStartTime;
    setSpatialStartTime(Date.now());
    setSpatialReactionTimes(prev => [...prev, reactionMs]);

    const nextUserSeq = [...spatialUserSeq, index];
    setSpatialUserSeq(nextUserSeq);

    // Target sequence based on Mode
    const targetSeq = spatialMode === 'reverse' ? [...spatialSequence].reverse() : spatialSequence;
    const currentStep = nextUserSeq.length - 1;

    if (nextUserSeq[currentStep] !== targetSeq[currentStep]) {
      // Failed round!
      setSpatialGameState('failed');
      showToast('اشتباه بود! الگوی حافظه قطع شد.', 'error');

      // Calculate partial accuracy for this attempt
      const completedSteps = Math.max(0, spatialLevel - 1);
      const partialAcc = Math.round((completedSteps / 4) * 100);
      const avgReaction = spatialReactionTimes.length > 0
        ? Math.round(spatialReactionTimes.reduce((a, b) => a + b, 0) / spatialReactionTimes.length)
        : 500;

      saveProfile({
        ...brainProfile,
        gamesPlayed: brainProfile.gamesPlayed + 1,
        totalAccuracies: [...brainProfile.totalAccuracies, partialAcc],
        reactionTimes: avgReaction > 0 ? [...brainProfile.reactionTimes, avgReaction] : brainProfile.reactionTimes
      });
      return;
    }

    // Check if step finished
    if (nextUserSeq.length === targetSeq.length) {
      const newStreak = spatialFaultlessStreak + 1;
      setSpatialFaultlessStreak(newStreak);

      if (spatialLevel >= 4) {
        setSpatialGameState('success');
        if (playAudioFeedback) playAudioFeedback('xp');

        const avgReaction = spatialReactionTimes.length > 0
          ? Math.round(spatialReactionTimes.reduce((a, b) => a + b, 0) / spatialReactionTimes.length)
          : 450;

        earnXp(40, `تکمیل چالش حافظه فضایی (${spatialDifficulty} - ${spatialMode})`);
        showToast(`آفرین! سطح با موفقیت طی شد. میانگین واکنش: ${avgReaction}ms. +۴۰ XP`, 'success');

        // Update real profile stats with 100% accuracy for full sequence success
        const updatedAccuracies = [...brainProfile.totalAccuracies, 100];
        const updatedReactions = [...brainProfile.reactionTimes, avgReaction];

        saveProfile({
          ...brainProfile,
          memoryScore: Math.min(100, brainProfile.memoryScore + 4),
          gamesPlayed: brainProfile.gamesPlayed + 1,
          totalAccuracies: updatedAccuracies,
          reactionTimes: updatedReactions
        });
      } else {
        const nextLvl = spatialLevel + 1;
        setSpatialLevel(nextLvl);
        showToast(`مرحله ${spatialLevel} با موفقیت کامل شد! مرحله بعد...`, 'info');
        setTimeout(() => generateSpatialSequence(nextLvl), 800);
      }
    }
  };

  // ----------------------------------------------------------------------
  // GAME 2: STROOP COGNITIVE TEST (چالش تداخل استروپ)
  // ----------------------------------------------------------------------
  type StroopMode = 'congruent' | 'incongruent' | 'neutral' | 'mixed';

  const STROOP_COLORS = [
    { name: 'قرمز', code: '#ef4444' },
    { name: 'آبی', code: '#3b82f6' },
    { name: 'سبز', code: '#10b981' },
    { name: 'زرد', code: '#eab308' },
    { name: 'بنفش', code: '#8b5cf6' }
  ];

  const NEUTRAL_WORDS = ['صندلی', 'درخت', '★ ستاره', 'کتاب', 'ساعت', '■ مربع'];

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

  // Stroop Reaction Time logs for Congruent vs Incongruent
  const [stroopCongruentTimes, setStroopCongruentTimes] = useState<number[]>([]);
  const [stroopIncongruentTimes, setStroopIncongruentTimes] = useState<number[]>([]);
  const [stroopStartTime, setStroopStartTime] = useState<number>(0);

  const startStroopGame = () => {
    if (playAudioFeedback) playAudioFeedback('click');
    setStroopScore(0);
    setStroopRound(1);
    setStroopCongruentTimes([]);
    setStroopIncongruentTimes([]);
    setStroopState('playing');
    nextStroopRound();
  };

  const nextStroopRound = () => {
    let modeToUse = stroopMode;
    if (stroopMode === 'mixed') {
      const rand = Math.random();
      if (rand < 0.35) modeToUse = 'congruent';
      else if (rand < 0.75) modeToUse = 'incongruent';
      else modeToUse = 'neutral';
    }

    let text = '';
    let colorIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let textIdx = Math.floor(Math.random() * STROOP_COLORS.length);
    let isCongruent = false;

    if (modeToUse === 'congruent') {
      text = STROOP_COLORS[colorIdx].name;
      isCongruent = true;
    } else if (modeToUse === 'neutral') {
      text = NEUTRAL_WORDS[Math.floor(Math.random() * NEUTRAL_WORDS.length)];
      isCongruent = false;
    } else {
      // Incongruent
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

    setStroopStartTime(Date.now());
  };

  const handleStroopAnswer = (selectedColorName: string) => {
    if (!stroopCurrentWord || stroopState !== 'playing') return;

    const reactionMs = Date.now() - stroopStartTime;
    const isCorrect = selectedColorName === stroopCurrentWord.correctColorName;
    const finalScore = isCorrect ? stroopScore + 1 : stroopScore;

    if (isCorrect) {
      if (playAudioFeedback) playAudioFeedback('click');
      setStroopScore(prev => prev + 1);

      if (stroopCurrentWord.isCongruent) {
        setStroopCongruentTimes(prev => [...prev, reactionMs]);
      } else {
        setStroopIncongruentTimes(prev => [...prev, reactionMs]);
      }
    }

    if (stroopRound >= 10) {
      setStroopState('finished');
      if (playAudioFeedback) playAudioFeedback('xp');

      const avgCongruent = stroopCongruentTimes.length > 0
        ? Math.round(stroopCongruentTimes.reduce((a, b) => a + b, 0) / stroopCongruentTimes.length)
        : 400;

      const avgIncongruent = stroopIncongruentTimes.length > 0
        ? Math.round(stroopIncongruentTimes.reduce((a, b) => a + b, 0) / stroopIncongruentTimes.length)
        : (reactionMs > 0 ? reactionMs : 580);

      const interferenceEffect = Math.max(0, avgIncongruent - avgCongruent);

      const finalEarn = finalScore * 4;
      const accuracyPercent = Math.min(100, Math.round((finalScore / 10) * 100));

      earnXp(finalEarn + 10, 'تکمیل ارزیابی تداخل استروپ');
      showToast(`آزمون پایان یافت! دقت: ${accuracyPercent}٪ | اثر تداخل: ${interferenceEffect}ms. +${finalEarn + 10} XP`, 'success');

      saveProfile({
        ...brainProfile,
        flexibilityScore: Math.min(100, Math.max(brainProfile.flexibilityScore, Math.round(finalScore * 10))),
        gamesPlayed: brainProfile.gamesPlayed + 1,
        totalAccuracies: [...brainProfile.totalAccuracies, accuracyPercent],
        reactionTimes: avgIncongruent > 0 ? [...brainProfile.reactionTimes, avgIncongruent] : brainProfile.reactionTimes
      });
    } else {
      setStroopRound(prev => prev + 1);
      nextStroopRound();
    }
  };

  // ----------------------------------------------------------------------
  // GAME 3: SPEED & MATH CALCULATIONS (سرعت پردازش)
  // ----------------------------------------------------------------------
  type MathTimeMode = 'sprint_30' | 'endurance_60' | 'survival_3';
  type MathDiffMode = 'basic' | 'advanced' | 'operator_reverse';

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

  useEffect(() => {
    let interval: any;
    if (mathState === 'playing' && mathTimeMode !== 'survival_3' && mathTimer > 0) {
      interval = setInterval(() => setMathTimer(t => t - 1), 1000);
    } else if (mathTimer === 0 && mathState === 'playing' && mathTimeMode !== 'survival_3') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMathState('finished');
      if (playAudioFeedback) playAudioFeedback('xp');
      const attempts = Math.max(1, mathRound);
      const mathAccuracy = Math.min(100, Math.round((mathScore / attempts) * 100));

      earnXp(mathScore * 3 + 10, 'تست سرعت پردازش و ریاضیات');
      showToast(`زمان تمام شد! پاسخ‌های درست: ${mathScore} | دقت: ${mathAccuracy}٪`, 'info');

      saveProfile({
        ...brainProfile,
        processingSpeed: Math.min(100, Math.max(brainProfile.processingSpeed, Math.round(mathScore * 3))),
        gamesPlayed: brainProfile.gamesPlayed + 1,
        totalAccuracies: [...brainProfile.totalAccuracies, mathAccuracy]
      });
    }
    return () => clearInterval(interval);
  }, [mathState, mathTimer, mathTimeMode, mathScore, mathRound]);

  const startMathGame = () => {
    if (playAudioFeedback) playAudioFeedback('click');
    setMathScore(0);
    setMathRound(1);
    setMathLives(3);
    setMathTimer(mathTimeMode === 'sprint_30' ? 30 : mathTimeMode === 'endurance_60' ? 60 : 999);
    setMathState('playing');
    generateMathProblem();
  };

  const generateMathProblem = () => {
    if (mathDiffMode === 'operator_reverse') {
      // Operator or Missing variable Mode: e.g. "7 ? 3 = 21" -> "?" is "×"
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
        // Missing Number: e.g. "18 ÷ ❓ = 6"
        let b = Math.floor(Math.random() * 8) + 2;
        let res = Math.floor(Math.random() * 9) + 2;
        let a = b * res;

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
      // Multiplication, division, mixed
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
        // Division
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
      // Basic addition and subtraction
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
  };

  const handleMathAnswer = (val: string) => {
    if (!mathProblem || mathState !== 'playing') return;

    if (val === mathProblem.correctAnswer) {
      if (playAudioFeedback) playAudioFeedback('click');
      setMathScore(prev => prev + 1);
    } else {
      if (playAudioFeedback) playAudioFeedback('click');
      if (mathTimeMode === 'survival_3') {
        const remaining = mathLives - 1;
        setMathLives(remaining);
        if (remaining <= 0) {
          setMathState('finished');
          if (playAudioFeedback) playAudioFeedback('xp');
          const attempts = Math.max(1, mathRound);
          const mathAccuracy = Math.min(100, Math.round((mathScore / attempts) * 100));

          earnXp(mathScore * 4, 'تست بقای محاسبات ذهنی');
          showToast(`جان‌های شما تمام شد! پاسخ‌های درست: ${mathScore} | دقت: ${mathAccuracy}٪`, 'info');

          saveProfile({
            ...brainProfile,
            processingSpeed: Math.min(100, Math.max(brainProfile.processingSpeed, Math.round(mathScore * 3))),
            gamesPlayed: brainProfile.gamesPlayed + 1,
            totalAccuracies: [...brainProfile.totalAccuracies, mathAccuracy]
          });
          return;
        }
      }
    }

    setMathRound(prev => prev + 1);
    generateMathProblem();
  };

  // ----------------------------------------------------------------------
  // TAB 3: CBT 8-STEP GUIDED THOUGHT REFRAMING + SAFETY GUARD
  // ----------------------------------------------------------------------
  const [cbtStep, setCbtStep] = useState(1);
  const [cbtSituation, setCbtSituation] = useState('');
  const [cbtThought, setCbtThought] = useState('');
  const [cbtInitialBelief, setCbtInitialBelief] = useState(80);
  const [cbtEmotion, setCbtEmotion] = useState('اضطراب و نگرانی');
  const [cbtEmotionIntensity, setCbtEmotionIntensity] = useState(75);
  const [cbtDistortion, setCbtDistortion] = useState('catastrophizing');
  const [cbtEvidenceFor, setCbtEvidenceFor] = useState('');
  const [cbtEvidenceAgainst, setCbtEvidenceAgainst] = useState('');
  const [cbtReframed, setCbtReframed] = useState('');
  const [cbtNewBelief, setCbtNewBelief] = useState(30);

  // Safety Crisis Overlay State
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  // Check text against Crisis keywords
  const checkSafetyGuard = (text: string) => {
    const lower = text.toLowerCase();
    const isDanger = CRISIS_KEYWORDS.some(kw => lower.includes(kw));
    if (isDanger) {
      setShowCrisisAlert(true);
    }
  };

  const handleNextCbtStep = () => {
    // Validate current input before stepping forward
    if (cbtStep === 1 && !cbtSituation.trim()) {
      showToast('لطفاً شرح موقعیت را وارد کنید.', 'error');
      return;
    }
    if (cbtStep === 2) {
      if (!cbtThought.trim()) {
        showToast('لطفاً فکر خودکار اولیه را وارد کنید.', 'error');
        return;
      }
      checkSafetyGuard(cbtThought);
    }
    if (cbtStep < 8) {
      setCbtStep(prev => prev + 1);
    }
  };

  const handleFinishCbtCycle = async () => {
    if (!cbtReframed.trim()) {
      showToast('لطفاً فکر جایگزین منطقی را وارد کنید.', 'error');
      return;
    }

    checkSafetyGuard(cbtReframed);

    const newRecord: CbtRecord = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cbt_' + Date.now(),
      situation: cbtSituation,
      automaticThought: cbtThought,
      initialBelief: cbtInitialBelief,
      emotion: cbtEmotion,
      emotionIntensity: cbtEmotionIntensity,
      distortion: cbtDistortion,
      evidenceFor: cbtEvidenceFor || 'مورد خاصی ثبت نشد',
      evidenceAgainst: cbtEvidenceAgainst || 'شواهد زیادی در جهت رد فکر وجود دارد',
      reframedThought: cbtReframed,
      newBelief: cbtNewBelief,
      date: new Date().toLocaleDateString('fa-IR')
    };

    const updated = [newRecord, ...cbtRecords];
    setCbtRecords(updated);
    
    try {
      await addCbtRecord(newRecord);
      earnXp(35, 'تکمیل چرخه کامل ۸ مرحله‌ای بازسازی شناختی افکار (CBT)');
      showToast('چرخه بازسازی افکار با موفقیت در سوپابیس ذخیره شد! +۳۵ XP', 'success');
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره CBT', 'error');
    }

    // Reset wizard
    setCbtStep(1);
    setCbtSituation('');
    setCbtThought('');
    setCbtEvidenceFor('');
    setCbtEvidenceAgainst('');
    setCbtReframed('');
  };

  const handleDeleteCbtRecord = async (id: string) => {
    const updated = cbtRecords.filter(r => r.id !== id);
    setCbtRecords(updated);
    try {
      await deleteCbtRecord(id);
      showToast('پیشینه مورد نظر حذف گردید.', 'info');
    } catch (e: any) {
      showToast(e.message || 'خطا در حذف پیشینه', 'error');
    }
  };

  // ----------------------------------------------------------------------
  // TAB 4: NEURO-HABITS & GAMIFIED DAILY MISSIONS
  // ----------------------------------------------------------------------
  const [newHabitTitle, setNewHabitTitle] = useState('');

  const toggleNeuroHabit = async (id: string) => {
    const target = neuroHabits.find(h => h.id === id);
    if (!target) return;

    const updatedHabit = { ...target, completed: !target.completed };
    setNeuroHabits(prev => prev.map(h => h.id === id ? updatedHabit : h));
    
    try {
      await saveNeuroHabit(updatedHabit);
      if (updatedHabit.completed) {
        earnXp(updatedHabit.xp, `ماموریت نورون‌سازی: ${updatedHabit.title}`);
        showToast(`ماموریت انجام شد! +${updatedHabit.xp} XP`, 'success');
        if (playAudioFeedback) playAudioFeedback('done');
      }
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره ماموریت', 'error');
    }
  };

  const handleAddCustomHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const newH: NeuroHabit = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'habit_' + Date.now(),
      title: newHabitTitle.trim(),
      completed: false,
      xp: 20,
      isCustom: true
    };

    const updated = [...neuroHabits, newH];
    setNeuroHabits(updated);
    
    try {
      await saveNeuroHabit(newH);
      showToast('عادت مغزی جدید با موفقیت اضافه و ذخیره شد!', 'success');
    } catch (e: any) {
      showToast(e.message || 'خطا در ذخیره عادت', 'error');
    }
    
    setNewHabitTitle('');
  };

  const completedMissionsCount = neuroHabits.filter(h => h.completed).length;

  // Selected Article Modal State
  const [selectedArticle, setSelectedArticle] = useState<typeof DEFAULT_NEURO_ARTICLES[0] | null>(null);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* HEADER BANNER - STANDARDIZED TITLE: باشگاه مغز */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>سامانه هوشمند نوروساینس و روانشناسی شناختی</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">باشگاه مغز</h1>
            <p className="text-xs sm:text-sm text-purple-200/80 max-w-2xl leading-relaxed">
              ارتقای حافظه کاری، افزایش انعطاف‌پذیری شناختی استروپ، بازسازی ۸ مرحله‌ای افکار (CBT) و ماموریت‌های روزانه سیناپس‌سازی.
            </p>
          </div>

          {/* Real Brain Index Score */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-4 shrink-0 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-[11px] text-purple-200">شاخص قدرت شناختی (Brain Index)</div>
              <div className="text-2xl font-black text-purple-300 flex items-center gap-1.5">
                <span>{overallIndex}</span>
                <span className="text-xs font-normal text-purple-200">/ ۱۰۰</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Dna className="w-6 h-6 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
          </div>
        </div>

        {/* SUB-TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-white/10 text-purple-100 hover:bg-white/20'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <span>پروفایل و آمارهای شناختی</span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'games'
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-white/10 text-purple-100 hover:bg-white/20'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>تمرین‌ها و چالش‌های شناختی</span>
          </button>

          <button
            onClick={() => setActiveTab('cbt')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'cbt'
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-white/10 text-purple-100 hover:bg-white/20'
            }`}
          >
            <Feather className="w-4 h-4 text-indigo-500" />
            <span>بازسازی ۸ مرحله‌ای افکار (CBT)</span>
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'habits'
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-white/10 text-purple-100 hover:bg-white/20'
            }`}
          >
            <Target className="w-4 h-4 text-pink-500" />
            <span>ماموریت‌های نورون‌سازی ({completedMissionsCount}/۵)</span>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'articles'
                ? 'bg-white text-slate-900 shadow-md scale-105'
                : 'bg-white/10 text-purple-100 hover:bg-white/20'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span>دانشنامه نوروساینس</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1: OVERVIEW & REAL PERFORMANCE METRICS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real Performance Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">قدرت حافظه کاری</span>
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{brainProfile.memoryScore}</span>
                <span className="text-[10px] text-slate-400">از ۱۰۰</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${brainProfile.memoryScore}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">انعطاف‌پذیری استروپ</span>
                <Layers className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{brainProfile.flexibilityScore}</span>
                <span className="text-[10px] text-slate-400">از ۱۰۰</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${brainProfile.flexibilityScore}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">میانگین زمان واکنش</span>
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{avgReactionMs}</span>
                <span className="text-[10px] text-slate-400">میلی‌ثانیه</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(20, 100 - avgReactionMs / 10)}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">میزان دقت شناختی</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{avgAccuracy}٪</span>
                <span className="text-[10px] text-slate-400">
                  {brainProfile.totalAccuracies.length > 0 ? `بر پایه ${brainProfile.totalAccuracies.length} آزمون` : 'بدون آزمون'}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${avgAccuracy}%` }} />
              </div>
            </div>
          </div>

          {/* Quick Challenge Start Banner */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-right">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                  🧠 تمرین پیشنهادی امروز
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">چالش حافظه فضایی (سطح‌بندی پیشرفته و الگوی معکوس)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                الگوها را بر روی شبکه‌های ۳×۳، ۴×۴ یا ۵×۵ به خاطر بسپارید یا در حالت معکوس از آخر به اول بازسازی کنید!
              </p>
            </div>

            <button
              onClick={() => {
                setActiveTab('games');
                startSpatialGame();
              }}
              className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-purple-500/20 shrink-0 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>شروع چالش حافظه فضایی (+۴۰ XP)</span>
            </button>
          </div>

          {/* Gamification Badges Section & Reset Controls */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>مدال‌ها و افتخارات شناختی مغز</span>
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetBrainProfile}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-colors"
                  title="صفر کردن تمام امتیازها و آمارهای شناختی"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی آمار (صفر کردن)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${completedMissionsCount >= 5 ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                <div className="text-2xl">⚡</div>
                <div>
                  <div className="font-black text-xs text-slate-900 dark:text-slate-100">نشان «ذهن فعال»</div>
                  <div className="text-[10px] text-slate-500">تکمیل هر ۵ ماموریت نورون‌سازی روزانه</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${brainProfile.gamesPlayed >= 5 ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                <div className="text-2xl">🏆</div>
                <div>
                  <div className="font-black text-xs text-slate-900 dark:text-slate-100">نشان «قهرمان شناختی»</div>
                  <div className="text-[10px] text-slate-500">انجام حداقل ۵ بازی تمرینی</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${cbtRecords.length >= 3 ? 'bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-60'}`}>
                <div className="text-2xl">🔮</div>
                <div>
                  <div className="font-black text-xs text-slate-900 dark:text-slate-100">نشان «بازساز افکار»</div>
                  <div className="text-[10px] text-slate-500">ثبت ۳ چرخه کامل CBT در سیستم</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2: STANDARDIZED & ENHANCED COGNITIVE GAMES */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GAME 1: ADVANCED SPATIAL MEMORY */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                    حافظه فضایی
                  </span>
                  <span className="text-xs font-bold text-slate-400">سطح {spatialLevel}</span>
                </div>

                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">چالش الگوی فضایی مغز</h3>

                {/* Controls for Difficulty & Mode */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">سطح دشواری:</label>
                    <select
                      value={spatialDifficulty}
                      onChange={e => setSpatialDifficulty(e.target.value as SpatialDifficulty)}
                      disabled={spatialGameState !== 'idle'}
                      className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold"
                    >
                      <option value="easy">آسان (۳×۳ - ۳ الگویی)</option>
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

              {/* Dynamic Grid Display */}
              {(() => {
                const cfg = getGridConfig(spatialDifficulty);
                return (
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
                );
              })()}

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
                  <div className="text-center text-xs font-bold text-purple-600 animate-pulse py-2">
                    دقت کنید! در حال نمایش الگو...
                  </div>
                )}
                {spatialGameState === 'user_turn' && (
                  <div className="text-center text-xs font-bold text-emerald-600 py-2">
                    {spatialMode === 'reverse' ? 'الگو را برعکس تکرار کنید!' : 'نوبت شماست! الگو را تکرار کنید'} ({spatialUserSeq.length} از {spatialSequence.length})
                  </div>
                )}
                {(spatialGameState === 'success' || spatialGameState === 'failed') && (
                  <button
                    onClick={startSpatialGame}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800"
                  >
                    تلاش مجدد
                  </button>
                )}
              </div>
            </div>

            {/* GAME 2: STANDARDIZED STROOP TEST */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
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

              {/* Game Stage */}
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
                    <div className="text-lg font-black text-emerald-600">امتیاز: {stroopScore} از ۱۰</div>
                    <p className="text-[11px] text-slate-400">شاخص اثر تداخل محاسبه و ثبت گردید.</p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">برای شروع روی دکمه زیر کلیک کنید.</div>
                )}
              </div>

              {/* Choice Buttons */}
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

            {/* GAME 3: MATH & OPERATOR REVERSE SPEED TEST */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
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

              {/* Problem Display */}
              <div className="my-4 text-center h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                {mathState === 'playing' && mathProblem ? (
                  <motion.div key={mathRound} initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 font-mono">
                    {mathProblem.displayStr}
                  </motion.div>
                ) : mathState === 'finished' ? (
                  <div className="space-y-1">
                    <div className="text-lg font-black text-amber-600">پاسخ صحیح: {mathScore}</div>
                    <p className="text-[11px] text-slate-400">سرعت پردازش عصبی به‌روزرسانی شد.</p>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">برای شروع روی دکمه زیر کلیک کنید.</div>
                )}
              </div>

              {/* Options */}
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

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3: CBT GUIDED 8-STEP THOUGHT REFRAMING & SAFETY GUARD */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'cbt' && (
        <div className="space-y-6">
          {/* SAFETY CRISIS OVERLAY MODAL */}
          <AnimatePresence>
            {showCrisisAlert && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 max-w-lg w-full rounded-3xl p-6 shadow-2xl space-y-5 text-right">
                  <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                    <HeartHandshake className="w-8 h-8 shrink-0 animate-bounce" />
                    <div>
                      <h3 className="font-black text-base">پیام حمایتی مهم سایبان</h3>
                      <p className="text-xs text-rose-500/90">شما تنها نیستید و سلامتی روان شما بی‌نهایت ارزشمند است.</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-rose-50/50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40">
                    اگر در لحظات رنج شدید روانشناختی، احساس بن‌بست یا افکار آسیب به خود هستید، لطفاً بلافاصله با خطوط مشاوره تلفنی رایگان و متخصصین صحبت کنید. گفتگو درباره احساسات نجات‌بخش است.
                  </p>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold">
                      <span>اورژانس اجتماعی بهزیستی (۲۴ ساعته)</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">📞 ۱۲۳</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold">
                      <span>صدای مستشار (مشاوره رایگان روانشناسی)</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">📞 ۱۴۸۰</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCrisisAlert(false)}
                    className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    متوجه شدم و متشکرم
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GUIDED 8-STEP CBT WIZARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  فرآیند متدولوژیک ۸ مرحله‌ای CBT
                </span>
                <span className="text-xs font-bold text-slate-400">مرحله {cbtStep} از ۸</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">کارگاه بازسازی شناختی و بازنویسی افکار</h3>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300"
                style={{ width: `${(cbtStep / 8) * 100}%` }}
              />
            </div>

            {/* Step Contents */}
            <div className="space-y-4">
              {cbtStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۱: موقعیت اولیه (چه اتفاقی افتاد یا چه محرکی رخ داد؟)
                  </label>
                  <input
                    type="text"
                    value={cbtSituation}
                    onChange={e => setCbtSituation(e.target.value)}
                    placeholder="مثلاً: در جلسه کاری پروپوزال ارائه دادم اما مدیر سوال پیچیده‌ای پرسید..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {cbtStep === 2 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۲: فکر خودکار (اولین فکری که بلافاصله به ذهنت رسید چه بود؟)
                  </label>
                  <textarea
                    rows={2}
                    value={cbtThought}
                    onChange={e => setCbtThought(e.target.value)}
                    placeholder="مثلاً: من در پاسخ دادن خراب کردم، حتماً همه فکر می‌کنند هیچی سرم نمی‌شود..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {cbtStep === 3 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۳: شدت باور به این فکر اولیه (چقدر به این فکر باور داری؟)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cbtInitialBelief}
                      onChange={e => setCbtInitialBelief(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <span className="font-mono text-sm font-black text-indigo-600 shrink-0">{cbtInitialBelief}٪</span>
                  </div>
                </div>
              )}

              {cbtStep === 4 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۴: هیجان تجربه شده و شدت آن
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={cbtEmotion}
                      onChange={e => setCbtEmotion(e.target.value)}
                      placeholder="مثلاً: اضطراب، خشم، غم، حس بی‌ارزشی..."
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">شدت:</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={cbtEmotionIntensity}
                        onChange={e => setCbtEmotionIntensity(Number(e.target.value))}
                        className="w-full accent-purple-600"
                      />
                      <span className="font-mono text-xs font-bold text-purple-600">{cbtEmotionIntensity}٪</span>
                    </div>
                  </div>
                </div>
              )}

              {cbtStep === 5 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۵: شناسایی خطای شناختی (Cognitive Distortion)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COGNITIVE_DISTORTIONS.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setCbtDistortion(d.id)}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                          cbtDistortion === d.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-900 dark:text-indigo-200'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-bold text-xs">{d.name}</div>
                        <div className="text-[10px] opacity-75 mt-0.5">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {cbtStep === 6 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۶: بررسی شواهد (دادگاه افکار)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[11px] text-slate-500 mb-1">شواهد موافق فکر منفی:</span>
                      <textarea
                        rows={2}
                        value={cbtEvidenceFor}
                        onChange={e => setCbtEvidenceFor(e.target.value)}
                        placeholder="چه دلایلی وجود دارد که این فکر درست باشد؟"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500 mb-1">شواهد مخالف (رد فکر منفی):</span>
                      <textarea
                        rows={2}
                        value={cbtEvidenceAgainst}
                        onChange={e => setCbtEvidenceAgainst(e.target.value)}
                        placeholder="چه شواهدی نشان می‌دهد این فکر نادرست یا مبالغه‌آمیز است؟"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cbtStep === 7 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۷: فکر جایگزین منطقی، کارآمد و مهربانانه (Reframed Thought)
                  </label>
                  <textarea
                    rows={2}
                    value={cbtReframed}
                    onChange={e => setCbtReframed(e.target.value)}
                    placeholder="مثلاً: سوال پیچیده مطرح شد و من کمی مکث کردم، اما کل ارائه عالی بود و این به معنای بی‌کفایتی نیست..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {cbtStep === 8 && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    مرحله ۸: ارزیابی مجدد باور منفی پس از بازسازی
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cbtNewBelief}
                      onChange={e => setCbtNewBelief(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                    <span className="font-mono text-sm font-black text-emerald-600 shrink-0">{cbtNewBelief}٪</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    کاهش باور منفی از {cbtInitialBelief}٪ به {cbtNewBelief}٪ نشان‌دهنده موفقیت فرآیند بازسازی شناختی است.
                  </p>
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={cbtStep === 1}
                onClick={() => setCbtStep(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                مرحله قبل
              </button>

              {cbtStep < 8 ? (
                <button
                  onClick={handleNextCbtStep}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  مرحله بعدی
                </button>
              ) : (
                <button
                  onClick={handleFinishCbtCycle}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold cursor-pointer"
                >
                  ثبت نهایی چرخه CBT (+۳۵ XP)
                </button>
              )}
            </div>
          </div>

          {/* HISTORY OF CBT RECORDS */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>تاریخچه افکار بازسازی شده شما در دیتابیس</span>
            </h4>

            {cbtRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Feather className="w-8 h-8 mx-auto text-slate-300 opacity-60" />
                <p className="text-xs">هنوز هیچ چرخه CBT ثبت نشده است. اولین چرخه را از فرم بالا شروع کنید!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cbtRecords.map(rec => (
                  <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-2 relative group">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold text-rose-500">فکر منفی: {rec.automaticThought}</span>
                      <div className="flex items-center gap-2">
                        <span>{rec.date}</span>
                        <button
                          onClick={() => handleDeleteCbtRecord(rec.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="حذف رکورد"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      فکر جایگزین منطقی: {rec.reframedThought}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                      <span>کاهش باور منفی: {rec.initialBelief}٪ ➔ {rec.newBelief}٪</span>
                      <span>خطا: {COGNITIVE_DISTORTIONS.find(d => d.id === rec.distortion)?.name || rec.distortion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 4: NEURO-HABITS & GAMIFIED DAILY MISSIONS */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full font-bold">
                  گیمیفیکیشن نورونسازی
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">ماموریت‌های روزانه ایجاد سیناپس جدید</h3>
              </div>

              <div className="flex items-center gap-2 bg-pink-50/80 dark:bg-pink-950/30 px-4 py-2 rounded-2xl border border-pink-200">
                <Flame className="w-5 h-5 text-pink-500 animate-bounce" />
                <span className="text-xs font-extrabold text-pink-800 dark:text-pink-200">
                  ماموریت‌های انجام شده: {completedMissionsCount} از {neuroHabits.length}
                </span>
              </div>
            </div>

            {/* List of Neuro Habits */}
            <div className="space-y-3">
              {neuroHabits.map(habit => (
                <div
                  key={habit.id}
                  onClick={() => toggleNeuroHabit(habit.id)}
                  className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    habit.completed
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 text-slate-800 dark:text-slate-200'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${habit.completed ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>
                      {habit.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-bold ${habit.completed ? 'line-through text-slate-400' : ''}`}>
                      {habit.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 px-2.5 py-1 rounded-full">
                    +{habit.xp} XP
                  </span>
                </div>
              ))}
            </div>

            {/* Add Custom Neuro-Habit Form */}
            <form onSubmit={handleAddCustomHabit} className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={newHabitTitle}
                onChange={e => setNewHabitTitle(e.target.value)}
                placeholder="افزودن عادت مغزی دلخواه (مثلاً: ۵ دقیقه یادگیری شطرنج)..."
                className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 5: NEUROSCIENCE KNOWLEDGE BASE ARTICLES */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {neuroArticles.map(art => (
              <div
                key={art.id}
                onClick={() => setSelectedArticle(art)}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-2xl">{art.icon}</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 font-bold">
                    {art.category} • {art.readTime}
                  </span>
                </div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{art.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {art.summary}
                </p>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span>مطالعه کامل مقاله</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          {/* ARTICLE READER MODAL */}
          <AnimatePresence>
            {selectedArticle && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl w-full rounded-3xl p-6 shadow-2xl space-y-5 text-right max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedArticle.icon}</span>
                      <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">{selectedArticle.title}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedArticle.content}
                  </div>

                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    بستن خوانش
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
