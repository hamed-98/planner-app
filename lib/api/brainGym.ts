// lib/api/brainGym.ts
export interface BrainProfile {
  memoryScore: number;
  flexibilityScore: number;
  processingSpeed: number;
  focusEnergy: number;
  gamesPlayed: number;
  totalAccuracies: number[];
  reactionTimes: number[];
  streakDays: number;
  lastPlayedDate: string;
  unlockedBadges: string[];
}

export interface CbtRecord {
  id: string;
  situation: string;
  automaticThought: string;
  initialBelief: number;
  emotion: string;
  emotionIntensity: number;
  distortion: string;
  evidenceFor: string;
  evidenceAgainst: string;
  reframedThought: string;
  newBelief: number;
  date: string;
}

export interface NeuroHabit {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
  isCustom?: boolean;
}

export interface BrainActivityLog {
  id?: string;
  game_type: "spatial_memory" | "stroop_test" | "math_speed";
  played_at?: string;
  raw_metrics: Record<string, any>;
  normalized_score: number | null;
}

export interface CognitiveMetricStatus {
  score: number | null;
  isCalibrating: boolean;
  sampleSize: number;
  todayScore: number | null;
  todayAttempts: number;
  lastPlayedAt: string | null;
}

export interface AggregatedBrainMetrics {
  spatialMemory: CognitiveMetricStatus;
  stroopFlexibility: CognitiveMetricStatus;
  mathSpeed: CognitiveMetricStatus;
  avgReactionTimeMs: number | null;
  accuracyRate: number | null;
  overallIndex: number | null;
  totalGamesAllTime: number;
}

export const DEFAULT_NEURO_HABITS: NeuroHabit[] = [
  { id: "1", title: "۱۰ دقیقه مطالعه غیردیجیتال", completed: false, xp: 15 },
  { id: "2", title: "پیاده‌روی آگاهانه بدون هندزفری", completed: false, xp: 15 },
  { id: "3", title: "حل پازل یا جدول شناختی", completed: false, xp: 20 },
  { id: "4", title: "تمرین یادآوری شبانه رویدادها", completed: false, xp: 15 },
  { id: "5", title: "تنفس ۴-۷-۸ برای ریست دوپامین", completed: false, xp: 20 },
];

export const DEFAULT_NEURO_ARTICLES = [
  {
    id: "neuroplasticity",
    title: "مغز منعطف: راهنمای علوم اعصاب برای تقویت حافظه",
    category: "علوم اعصاب",
    readTime: "۵ دقیقه",
    icon: "Brain",
    summary: "نوروپلاستیستی چگونه مغز شما را قادر به رشد و بازسازی در هر سنی می‌کند...",
    content: "تحقیقات علوم اعصاب نوین نشان می‌دهد که سلول‌های خاکستری مغز انعطاف‌پذیرند...",
  },
  {
    id: "dopamine-fasting",
    title: "فستینگ دوپامین: بازنشانی توجه و تمرکز در عصر حواس‌پرتی",
    category: "تمرکز و ذهن",
    readTime: "۴ دقیقه",
    icon: "Zap",
    summary: "روش‌های علمی برای کاهش محرک‌های آنی و بازیابی مدار انگیزه طبیعی...",
    content: "در دنیایی پر از نوتیفیکیشن‌های بی‌پایان، مدارهای پاداش مغز به راحتی فرسوده می‌شوند...",
  },
];

export const ZERO_BRAIN_PROFILE: BrainProfile = {
  memoryScore: 0,
  flexibilityScore: 0,
  processingSpeed: 0,
  focusEnergy: 0,
  gamesPlayed: 0,
  totalAccuracies: [],
  reactionTimes: [],
  streakDays: 0,
  lastPlayedDate: "",
  unlockedBadges: [],
};

// کلیدهای حافظه محلی
const KEYS = {
  PROFILE: 'sayeban_brain_profile',
  METRICS: 'sayeban_brain_metrics',
  CBT: 'sayeban_cbt_records',
  HABITS: 'sayeban_neuro_habits',
  QUEUE_ACTIVITIES: 'sayeban_pending_brain_activities',
  QUEUE_PROFILE: 'sayeban_pending_brain_profile',
  QUEUE_CBT: 'sayeban_pending_cbt_ops',
  QUEUE_HABITS: 'sayeban_pending_neuro_habits',
};

// اعلان تغییر برای هماهنگی بلادرنگ بین تب‌ها
function notifyProfileUpdate(profile?: BrainProfile) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sayeban_brain_updated', {
        detail: { profile },
      })
    );
  }
}

// ----------------------------------------------------
// ۱. پروفایل مغز (BrainProfile)
// ----------------------------------------------------
export async function getBrainProfile(): Promise<BrainProfile> {
  let localData: BrainProfile = ZERO_BRAIN_PROFILE;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(KEYS.PROFILE);
    if (saved) {
      try { localData = JSON.parse(saved); } catch {}
    }
  }

  try {
    const res = await fetch("/api/brain-gym/profile", { cache: "no-store" });
    if (!res.ok) return localData;
    const serverData = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(serverData));
    }
    return serverData;
  } catch {
    return localData;
  }
}

// ادغام هوشمند عادات کاربر با ۵ ماموریت پیش‌فرض سیستم
function mergeWithDefaultHabits(userHabits: NeuroHabit[]): NeuroHabit[] {
  const habitMap = new Map<string, NeuroHabit>();

  // ۱. قرار دادن ۵ ماموریت پایه
  DEFAULT_NEURO_HABITS.forEach((h) => habitMap.set(h.id, { ...h }));

  // ۲. اعمال تغییرات کاربر (تیک خوردن یا عادات دست‌ساز) روی لیست پایه
  if (Array.isArray(userHabits)) {
    userHabits.forEach((h) => {
      if (habitMap.has(h.id)) {
        habitMap.set(h.id, { ...habitMap.get(h.id)!, ...h });
      } else {
        habitMap.set(h.id, h);
      }
    });
  }

  return Array.from(habitMap.values());
}

export async function saveBrainProfile(profile: BrainProfile): Promise<boolean> {
  // ۱. ذخیره فوری و محلی
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    notifyProfileUpdate();
  }

  // ۲. ارسال به سرور یا ذخیره در صف سینک
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const res = await fetch("/api/brain-gym/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        if (typeof window !== 'undefined') localStorage.removeItem(KEYS.QUEUE_PROFILE);
        return true;
      }
    }
  } catch {}

  // در صورت قطعی یا خطا در صف معوق قرار می‌گیرد
  if (typeof window !== 'undefined') {
    localStorage.setItem(KEYS.QUEUE_PROFILE, JSON.stringify(profile));
  }
  return true;
}

// ----------------------------------------------------
// ۲. ثبت فعالیت‌ها (BrainActivityLog)
// ----------------------------------------------------
export async function logBrainActivity(
  gameType: "spatial_memory" | "stroop_test" | "math_speed",
  rawMetrics: Record<string, any>,
  normalizedScore: number | null,
): Promise<boolean> {
  const logPayload = {
    gameType,
    rawMetrics,
    normalizedScore,
    playedAt: new Date().toISOString(),
  };

  let updatedMetrics: AggregatedBrainMetrics | null = null;
  let updatedProfile: BrainProfile | null = null;

  // ۱. آپدیت قطعی و فوری حافظه محلی
  if (typeof window !== "undefined") {
    try {
      // الف) آپدیت یا ساخت آبجکت متریک‌های تجمیعی
      const rawMetricsStr = localStorage.getItem(KEYS.METRICS);
      let metrics: AggregatedBrainMetrics;
      if (rawMetricsStr) {
        metrics = JSON.parse(rawMetricsStr);
      } else {
        metrics = {
          spatialMemory: { score: null, isCalibrating: true, sampleSize: 0, todayScore: null, todayAttempts: 0, lastPlayedAt: null },
          stroopFlexibility: { score: null, isCalibrating: true, sampleSize: 0, todayScore: null, todayAttempts: 0, lastPlayedAt: null },
          mathSpeed: { score: null, isCalibrating: true, sampleSize: 0, todayScore: null, todayAttempts: 0, lastPlayedAt: null },
          avgReactionTimeMs: null,
          accuracyRate: null,
          overallIndex: null,
          totalGamesAllTime: 0,
        };
      }

      metrics.totalGamesAllTime = (metrics.totalGamesAllTime || 0) + 1;

      const keyMap = {
        spatial_memory: "spatialMemory",
        stroop_test: "stroopFlexibility",
        math_speed: "mathSpeed",
      } as const;

      const targetKey = keyMap[gameType];
      if (targetKey && metrics[targetKey]) {
        metrics[targetKey].todayAttempts = (metrics[targetKey].todayAttempts || 0) + 1;
        metrics[targetKey].sampleSize = (metrics[targetKey].sampleSize || 0) + 1;
        if (normalizedScore !== null) {
          metrics[targetKey].todayScore = normalizedScore;
          metrics[targetKey].score = normalizedScore;
          metrics[targetKey].isCalibrating = false;
        }
        metrics[targetKey].lastPlayedAt = new Date().toISOString();
      }

      localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics));
      updatedMetrics = metrics;

      // ب) آپدیت یا ساخت پروفایل مغز
      const rawProfileStr = localStorage.getItem(KEYS.PROFILE);
      let profile: BrainProfile;
      if (rawProfileStr) {
        profile = JSON.parse(rawProfileStr);
      } else {
        profile = { ...ZERO_BRAIN_PROFILE };
      }

      profile.gamesPlayed = (profile.gamesPlayed || 0) + 1;
      profile.lastPlayedDate = new Date().toISOString().split("T")[0];
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
      updatedProfile = profile;

      // ج) شلیک رویداد تغییر برای به‌روزرسانی بلادرنگ استیت ری‌اکت
      window.dispatchEvent(
        new CustomEvent("sayeban_brain_updated", {
          detail: { metrics: updatedMetrics, profile: updatedProfile },
        })
      );
    } catch (e) {
      console.error("خطا در به‌روزرسانی محلی متریک‌ها:", e);
    }
  }

  // ۲. ارسال مستقیم به سرور یا ذخیره در صف آفلاین
  try {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      const res = await fetch("/api/brain-gym/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logPayload),
      });
      if (res.ok) return true;
    }
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const queue = JSON.parse(localStorage.getItem(KEYS.QUEUE_ACTIVITIES) || "[]");
      queue.push(logPayload);
      localStorage.setItem(KEYS.QUEUE_ACTIVITIES, JSON.stringify(queue));
    } catch {}
  }
  return true;
}

// ----------------------------------------------------
// ۳. متریکس‌های تجمیعی (Aggregated Metrics)
// ----------------------------------------------------
export async function getAggregatedBrainMetrics(
  clientTodayStr?: string,
): Promise<AggregatedBrainMetrics | null> {
  let cachedMetrics: AggregatedBrainMetrics | null = null;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(KEYS.METRICS);
    if (saved) {
      try { cachedMetrics = JSON.parse(saved); } catch {}
    }
  }

  try {
    const url = clientTodayStr
      ? `/api/brain-gym/activity?today=${encodeURIComponent(clientTodayStr)}`
      : "/api/brain-gym/activity";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return cachedMetrics;
    const data = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYS.METRICS, JSON.stringify(data));
    }
    return data;
  } catch {
    return cachedMetrics;
  }
}

// ----------------------------------------------------
// ۴. دفترچه CBT
// ----------------------------------------------------
export async function getCbtRecords(): Promise<CbtRecord[]> {
  let localCbts: CbtRecord[] = [];
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(KEYS.CBT);
    if (saved) {
      try { localCbts = JSON.parse(saved); } catch {}
    }
  }

  try {
    const res = await fetch("/api/brain-gym/cbt", { cache: "no-store" });
    if (!res.ok) return localCbts;
    const serverData = await res.json();
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYS.CBT, JSON.stringify(serverData));
    }
    return serverData;
  } catch {
    return localCbts;
  }
}

export async function addCbtRecord(record: CbtRecord): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const current = JSON.parse(localStorage.getItem(KEYS.CBT) || '[]');
      localStorage.setItem(KEYS.CBT, JSON.stringify([record, ...current]));
    } catch {}
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const res = await fetch("/api/brain-gym/cbt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      if (res.ok) return true;
    }
  } catch {}

  if (typeof window !== 'undefined') {
    const queue = JSON.parse(localStorage.getItem(KEYS.QUEUE_CBT) || '[]');
    queue.push({ action: 'create', data: record });
    localStorage.setItem(KEYS.QUEUE_CBT, JSON.stringify(queue));
  }
  return true;
}

export async function deleteCbtRecord(id: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const current: CbtRecord[] = JSON.parse(localStorage.getItem(KEYS.CBT) || '[]');
      localStorage.setItem(KEYS.CBT, JSON.stringify(current.filter((r) => r.id !== id)));
    } catch {}
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const res = await fetch(`/api/brain-gym/cbt?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) return true;
    }
  } catch {}

  if (typeof window !== 'undefined') {
    const queue = JSON.parse(localStorage.getItem(KEYS.QUEUE_CBT) || '[]');
    queue.push({ action: 'delete', data: { id } });
    localStorage.setItem(KEYS.QUEUE_CBT, JSON.stringify(queue));
  }
  return true;
}

// ----------------------------------------------------
// ۵. عادات نورونی (Neuro Habits)
// ----------------------------------------------------
export async function getNeuroHabits(): Promise<NeuroHabit[]> {
  let localHabits = DEFAULT_NEURO_HABITS;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(KEYS.HABITS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        localHabits = mergeWithDefaultHabits(parsed);
      } catch {}
    }
  }

  try {
    const res = await fetch("/api/brain-gym/habits", { cache: "no-store" });
    if (!res.ok) return localHabits;
    const data = await res.json();
    if (Array.isArray(data)) {
      const merged = mergeWithDefaultHabits(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem(KEYS.HABITS, JSON.stringify(merged));
      }
      return merged;
    }
    return localHabits;
  } catch {
    return localHabits;
  }
}

export async function saveNeuroHabit(habit: NeuroHabit): Promise<boolean> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(KEYS.HABITS);
      const currentList = raw ? JSON.parse(raw) : [];
      const fullList = mergeWithDefaultHabits(currentList);
      const updated = fullList.map((h) => (h.id === habit.id ? habit : h));
      if (!fullList.some((h) => h.id === habit.id)) {
        updated.push(habit);
      }
      localStorage.setItem(KEYS.HABITS, JSON.stringify(updated));
    } catch {}
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const res = await fetch("/api/brain-gym/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habit),
      });
      if (res.ok) return true;
    }
  } catch {}

  if (typeof window !== 'undefined') {
    const queue = JSON.parse(localStorage.getItem(KEYS.QUEUE_HABITS) || '[]');
    queue.push(habit);
    localStorage.setItem(KEYS.QUEUE_HABITS, JSON.stringify(queue));
  }
  return true;
}

export async function getNeuroArticlesGlobal(): Promise<any[]> {
  try {
    const res = await fetch("/api/settings?id=neuro_articles");
    if (!res.ok) return DEFAULT_NEURO_ARTICLES;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_NEURO_ARTICLES;
  } catch {
    return DEFAULT_NEURO_ARTICLES;
  }
}


// ----------------------------------------------------
// ۶. موتور تخلیه صفوف آفلاین باشگاه مغز (Sync Engine)
// ----------------------------------------------------
// متغیر سراسری قفل جهت جلوگیری از شلیک موازی درخواست‌ها (Fix 1)
let isBrainSyncRunning = false; // متغیر تمیز و یکتا

export async function flushBrainGymOfflineQueue(): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine || isBrainSyncRunning) return;
  isBrainSyncRunning = true;

  try {
    // ۱. پروفایل
    const pendingProfile = localStorage.getItem(KEYS.QUEUE_PROFILE);
    if (pendingProfile) {
      try {
        const res = await fetch("/api/brain-gym/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: pendingProfile,
        });
        if (res.ok || res.status < 500) localStorage.removeItem(KEYS.QUEUE_PROFILE);
      } catch {}
    }

    // ۲. لاگ بازی‌ها
    const pendingActivities = JSON.parse(localStorage.getItem(KEYS.QUEUE_ACTIVITIES) || '[]');
    if (pendingActivities.length > 0) {
      const remaining = [];
      for (const log of pendingActivities) {
        try {
          const res = await fetch("/api/brain-gym/activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(log),
          });
          if (!res.ok && res.status >= 500) remaining.push(log);
        } catch {
          remaining.push(log);
        }
      }
      localStorage.setItem(KEYS.QUEUE_ACTIVITIES, JSON.stringify(remaining));
    }

    // ۳. رکوردهای CBT
    const pendingCbt = JSON.parse(localStorage.getItem(KEYS.QUEUE_CBT) || '[]');
    if (pendingCbt.length > 0) {
      const remaining = [];
      for (const item of pendingCbt) {
        try {
          if (item.action === 'create') {
            const res = await fetch("/api/brain-gym/cbt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item.data),
            });
            if (!res.ok && res.status >= 500) remaining.push(item);
          } else if (item.action === 'delete') {
            const res = await fetch(`/api/brain-gym/cbt?id=${encodeURIComponent(item.data.id)}`, {
              method: "DELETE",
            });
            if (!res.ok && res.status >= 500) remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem(KEYS.QUEUE_CBT, JSON.stringify(remaining));
    }

    // ۴. عادات نورونی (رفع باگ ۲)
    const pendingHabits = JSON.parse(localStorage.getItem(KEYS.QUEUE_HABITS) || '[]');
    if (pendingHabits.length > 0) {
      const remaining = [];
      for (const habit of pendingHabits) {
        try {
          const res = await fetch("/api/brain-gym/habits", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(habit),
          });
          if (!res.ok && res.status >= 500) remaining.push(habit);
        } catch {
          remaining.push(habit);
        }
      }
      localStorage.setItem(KEYS.QUEUE_HABITS, JSON.stringify(remaining));
    }
  } finally {
    isBrainSyncRunning = false;
  }
}