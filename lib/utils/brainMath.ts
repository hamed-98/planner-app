// lib/utils/brainMath.ts
import { BrainProfile } from "../supabase/brainGym";

export const MAX_HISTORY_LENGTH = 20;

export function pushWithLimit(
  arr: number[] = [],
  value: number,
  limit = MAX_HISTORY_LENGTH,
): number[] {
  const cleanArr = Array.isArray(arr) ? arr : [];
  return [...cleanArr.slice(-(limit - 1)), Math.round(value)];
}

export function calculateAverage(arr: number[] = []): number {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + (Number(val) || 0), 0);
  return Math.round(sum / arr.length);
}

export function calculateBrainIndex(profile: BrainProfile): number {
  if (!profile || profile.gamesPlayed === 0) return 0;
  const total =
    (profile.memoryScore || 0) +
    (profile.flexibilityScore || 0) +
    (profile.processingSpeed || 0) +
    (profile.focusEnergy || 0);
  return Math.round(total / 4);
}

export function calculateStroopInterference(
  congruentTimes: number[] = [],
  incongruentTimes: number[] = [],
): number {
  const avgCongruent = calculateAverage(congruentTimes) || 400;
  const avgIncongruent = calculateAverage(incongruentTimes) || 580;
  return Math.max(0, avgIncongruent - avgCongruent);
}

const MIN_PLAUSIBLE_RT_MS = 450; // حداقل زمان ممکن برای تصمیم‌گیری آگاهانه مغز

/**
 * ۱. فرمول استاندارد و ضربی انعطاف‌پذیری استروپ
 */
export function calculateStroopScore(
  congruentTimes: number[] = [],
  incongruentTimes: number[] = [],
  mistakes: number = 0,
  totalRounds: number = 10
): { normalizedScore: number | null; rawMetrics: Record<string, any>; isValid: boolean } {
  const correct = Math.max(0, totalRounds - mistakes);
  const allTimes = [...congruentTimes, ...incongruentTimes];

  // ۱. فیلتر پاسخ‌های غیرفیزیولوژیک (کلیک فوق‌سریع و رندوم)
  const tooFastCount = allTimes.filter(t => t < MIN_PLAUSIBLE_RT_MS).length;
  const implausibleRatio = allTimes.length > 0 ? tooFastCount / allTimes.length : 0;

  if (implausibleRatio > 0.3) {
    return {
      normalizedScore: null,
      isValid: false,
      rawMetrics: {
        correct,
        mistakes,
        too_fast_ratio: Math.round(implausibleRatio * 100),
        status: 'invalid_anticipatory_clicking'
      }
    };
  }

  // ۲. پالایش زمان‌ها و محاسبه تداخل واقعی
  const validCongruent = congruentTimes.filter(t => t >= MIN_PLAUSIBLE_RT_MS);
  const validIncongruent = incongruentTimes.filter(t => t >= MIN_PLAUSIBLE_RT_MS);

  const avgCongruent = calculateAverage(validCongruent) || 600;
  const avgIncongruent = calculateAverage(validIncongruent) || 900;
  const interference = Math.max(0, avgIncongruent - avgCongruent);

  // ۳. محاسبه فاکتور سرعت و مهار تداخل
  let speedFactor = 0.4;
  if (interference <= 150) speedFactor = 1.0;
  else if (interference <= 350) speedFactor = 0.85;
  else if (interference <= 550) speedFactor = 0.65;

  // ۴. ترکیب ضربی دقت و سرعت
  const accuracyRatio = correct / totalRounds;
  const normalizedScore = Math.round(accuracyRatio * speedFactor * 100);

  return {
    normalizedScore: Math.max(0, Math.min(100, normalizedScore)),
    isValid: true,
    rawMetrics: {
      avg_congruent_ms: Math.round(avgCongruent),
      avg_incongruent_ms: Math.round(avgIncongruent),
      interference_ms: Math.round(interference),
      mistakes,
      correct
    }
  };
}

/**
 * فرمول حافظه کاری فضایی
 */
export function calculateSpatialScore(
  maxSpanReached: number,
  totalMistakes: number = 0
): { normalizedScore: number; rawMetrics: Record<string, any> } {
  // بر اساس قانون میلر (اسپن ۳ = ۳۰ امتیاز، اسپن ۹ = ۱۰۰ امتیاز)
  let score = 30 + ((maxSpanReached - 3) / 6) * 70;
  score -= totalMistakes * 5;

  const normalizedScore = Math.max(10, Math.min(100, Math.round(score)));

  return {
    normalizedScore,
    rawMetrics: {
      max_span: maxSpanReached,
      mistakes: totalMistakes
    }
  };
}

/**
 * ۲. فرمول استاندارد و ضربی سرعت محاسبات ذهنی (Math Speed)
 */
export function calculateMathSpeedScore(
  correctAnswers: number,
  incorrectAnswers: number,
  averageReactionTimeMs: number
): { normalizedScore: number | null; rawMetrics: Record<string, any>; isValid: boolean } {
  const totalAttempts = correctAnswers + incorrectAnswers;

  if (totalAttempts === 0) {
    return { normalizedScore: null, isValid: false, rawMetrics: { status: 'empty' } };
  }

  // اگر میانگین واکنش کمتر از ۴۰۰ms برای ریاضی باشد، کلیک تصادفی است
  if (averageReactionTimeMs > 0 && averageReactionTimeMs < 400) {
    return {
      normalizedScore: null,
      isValid: false,
      rawMetrics: { correct: correctAnswers, incorrect: incorrectAnswers, status: 'invalid_guessing' }
    };
  }

  // ضریب دقت
  const accuracyRatio = correctAnswers / totalAttempts;

  // ضریب توان عملیاتی (Throughput: بر مبنای رسیدن به ۲۰ پاسخ در ۶۰ ثانیه)
  const volumeFactor = Math.min(1.0, correctAnswers / 20);

  // ضریب سرعت پاسخ‌دهی
  let speedMultiplier = 0.7;
  if (averageReactionTimeMs > 0 && averageReactionTimeMs <= 1800) speedMultiplier = 1.0;
  else if (averageReactionTimeMs <= 3000) speedMultiplier = 0.85;

  // ترکیب ضربی: دقت × حجم خروجی × سرعت
  const normalizedScore = Math.round(accuracyRatio * volumeFactor * speedMultiplier * 100);

  return {
    normalizedScore: Math.max(0, Math.min(100, normalizedScore)),
    isValid: true,
    rawMetrics: {
      correct: correctAnswers,
      incorrect: incorrectAnswers,
      avg_reaction_ms: Math.round(averageReactionTimeMs)
    }
  };
}

export function calculateLevelData(totalXp: number) {
  let level = 1;
  let xpForNextLevel = 100;
  let currentLevelBaseXp = 0;

  while (totalXp >= currentLevelBaseXp + xpForNextLevel) {
    currentLevelBaseXp += xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(100 * Math.pow(level, 1.3));
  }

  const xpInCurrentLevel = totalXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpForNextLevel) * 100)));
  const xpRemaining = xpForNextLevel - xpInCurrentLevel;

  let title = "جوانه سیناپسی 🌱";
  if (level >= 4) title = "فعال‌ساز نورونی ⚡";
  if (level >= 7) title = "معمار شکل‌پذیری 🔮";
  if (level >= 10) title = "استاد کورتکس 👑";

  return {
    level,
    title,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercent,
    xpRemaining
  };
}