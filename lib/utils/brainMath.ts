import { BrainProfile } from "../supabase/brainGym";

export const MAX_HISTORY_LENGTH = 20;

/**
 * اضافه کردن مقدار جدید به آرایه با حفظ سقف ۲۰ تایی (Moving Window)
 */
export function pushWithLimit(
  arr: number[],
  value: number,
  limit = MAX_HISTORY_LENGTH,
): number[] {
  const cleanArr = Array.isArray(arr) ? arr : [];
  return [...cleanArr.slice(-(limit - 1)), Math.round(value)];
}

/**
 * محاسبه میانگین یک آرایه از اعداد
 */
export function calculateAverage(arr: number[]): number {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / arr.length);
}

/**
 * محاسبه شاخص کلی مغز (Brain Index)
 */
export function calculateBrainIndex(profile: BrainProfile): number {
  if (!profile || profile.gamesPlayed === 0) return 0;
  const total =
    (profile.memoryScore || 0) +
    (profile.flexibilityScore || 0) +
    (profile.processingSpeed || 0) +
    (profile.focusEnergy || 0);
  return Math.round(total / 4);
}

/**
 * محاسبه اثر تداخل استروپ (تفاوت زمان ناهمخوان از همخوان)
 */
export function calculateStroopInterference(
  congruentTimes: number[],
  incongruentTimes: number[],
): number {
  const avgCongruent = calculateAverage(congruentTimes) || 400;
  const avgIncongruent = calculateAverage(incongruentTimes) || 580;
  return Math.max(0, avgIncongruent - avgCongruent);
}


// مسیر: lib/utils/brainMath.ts

export function calculateLevelData(totalXp: number) {
  let level = 1;
  let xpForNextLevel = 100; // سطح اول با 100 اکس‌پی پر میشه
  let currentLevelBaseXp = 0;

  // محاسبه تصاعدی سطح (هر سطح سخت‌تر از قبلی)
  while (totalXp >= currentLevelBaseXp + xpForNextLevel) {
    currentLevelBaseXp += xpForNextLevel;
    level++;
    // فرمول تصاعدی: مثلا 100 * (1.3 ^ level)
    xpForNextLevel = Math.floor(100 * Math.pow(level, 1.3)); 
  }

  const xpInCurrentLevel = totalXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpForNextLevel) * 100)));
  const xpRemaining = xpForNextLevel - xpInCurrentLevel;

  // تعیین عنوان شناختی بر اساس سطح
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