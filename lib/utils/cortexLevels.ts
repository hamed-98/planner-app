export interface CortexLevelInfo {
  level: number;
  title: string;
  badgeIcon: string;
  currentLevelXp: number;     // XP کسب‌شده در سطح فعلی
  xpForNextLevel: number;     // کل XP مورد نیاز برای عبور از این سطح
  progressPercent: number;    // درصد پیشرفت تا لول بعد
  xpRemaining: number;        // XP باقی‌مانده تا لول بعد
  unlockablePerk: string;     // فیچری که در لول بعد باز می‌شود
}

/**
 * عناوین و مزایای بازشونده در هر رده سطوح
 */
const COGNITIVE_RANKS = [
  { maxLevel: 3, title: 'جوانه سیناپسی', icon: '🌱', perk: 'باز شدن مود بقا در تست سرعت' },
  { maxLevel: 6, title: 'فعال‌ساز نورونی', icon: '⚡', perk: 'باز شدن شبکه ۵×۵ در حافظه فضایی' },
  { maxLevel: 9, title: 'معمار شکل‌پذیری', icon: '🔮', perk: 'تحلیل پیشرفته اثر تداخل استروپ' },
  { maxLevel: 14, title: 'استاد کورتکس پیش‌پیشانی', icon: '👑', perk: 'تم اختصاصی Deep Neuro' },
  { maxLevel: 999, title: 'نخبه فراشناخت (Transcendence)', icon: '💎', perk: 'تسلط کامل بر تمام ماژول‌ها' }
];

/**
 * فرمول تصاعدی محاسبه کل XP تجمعی مورد نیاز برای رسیدن به یک لول خاص
 */
export function getCumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.35));
}

/**
 * محاسبه وضعیت کامل لول و نوار پیشرفت بر اساس کل XP کاربر
 */
export function getCortexLevelInfo(totalXp: number): CortexLevelInfo {
  let level = 1;
  while (totalXp >= getCumulativeXpForLevel(level + 1)) {
    level++;
  }

  const currentLevelBaseXp = getCumulativeXpForLevel(level);
  const nextLevelBaseXp = getCumulativeXpForLevel(level + 1);
  const xpNeededThisLevel = nextLevelBaseXp - currentLevelBaseXp;
  const currentXpInLevel = totalXp - currentLevelBaseXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentXpInLevel / xpNeededThisLevel) * 100)));
  const xpRemaining = Math.max(0, nextLevelBaseXp - totalXp);

  const rank = COGNITIVE_RANKS.find(r => level <= r.maxLevel) || COGNITIVE_RANKS[COGNITIVE_RANKS.length - 1];

  return {
    level,
    title: rank.title,
    badgeIcon: rank.icon,
    currentLevelXp: currentXpInLevel,
    xpForNextLevel: xpNeededThisLevel,
    progressPercent,
    xpRemaining,
    unlockablePerk: rank.perk
  };
}

/**
 * محاسبه ضریب بونوس استمرار روزانه (Streak Multiplier)
 */
export function getStreakMultiplier(streakDays: number): { multiplier: number; label: string } {
  if (streakDays >= 7) return { multiplier: 1.5, label: '۱.۵× (بونوس فوق‌العاده)' };
  if (streakDays >= 5) return { multiplier: 1.3, label: '۱.۳× (تمرکز عالی)' };
  if (streakDays >= 3) return { multiplier: 1.15, label: '۱.۱۵× (پیوستگی خوب)' };
  return { multiplier: 1.0, label: '۱.۰× (عادی)' };
}