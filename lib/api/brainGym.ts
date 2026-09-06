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
  game_type: 'spatial_memory' | 'stroop_test' | 'math_speed';
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
  { id: '1', title: 'تمرین تنفس عمیق (جعبه‌ای)', completed: false, xp: 15 },
  { id: '2', title: 'پیاده‌روی آگاهانه (۱۰ دقیقه)', completed: false, xp: 15 },
  { id: '3', title: 'نوشتن جریان سیال ذهن', completed: false, xp: 20 },
  { id: '4', title: 'فاصله گرفتن از نور آبی پیش از خواب', completed: false, xp: 15 },
  { id: '5', title: 'یک بازی تمرکز ذهن', completed: false, xp: 20 },
];

export const DEFAULT_NEURO_ARTICLES = [
  {
    id: 'neuroplasticity',
    title: 'انعطاف‌پذیری عصبی چیست؟',
    category: 'مبانی مغز',
    readTime: '۳ دقیقه',
    icon: '🧠',
    summary: 'چگونه مغز با یادگیری و تجارب جدید مسیرهای عصبی خود را از نو می‌سازد.',
    content: 'تحقیقات نشان می‌دهند که مغز تا پایان عمر توانایی ساخت اتصالات جدید را حفظ می‌کند...',
  },
  {
    id: 'dopamine-fasting',
    title: 'تنظیم مدار پاداش و دوپامین',
    category: 'تمرکز',
    readTime: '۴ دقیقه',
    icon: '⚡',
    summary: 'راهکارهای کاهش بمباران اطلاعاتی و بهبود حساسیت گیرنده‌های دوپامین.',
    content: 'دوپامین هورمون انگیزه است، نه صرفاً لذت. با فواصل آگاهانه بازدهی ذهنی خود را دوچندان کنید...',
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
  lastPlayedDate: '',
  unlockedBadges: [],
};

export async function getBrainProfile(): Promise<BrainProfile> {
  try {
    const res = await fetch('/api/brain-gym/profile', { cache: 'no-store' });
    if (!res.ok) return ZERO_BRAIN_PROFILE;
    return await res.json();
  } catch (err) {
    console.error('getBrainProfile error:', err);
    return ZERO_BRAIN_PROFILE;
  }
}

export async function saveBrainProfile(profile: BrainProfile): Promise<boolean> {
  try {
    const res = await fetch('/api/brain-gym/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch (err) {
    console.error('saveBrainProfile error:', err);
    return false;
  }
}

export async function getCbtRecords(): Promise<CbtRecord[]> {
  try {
    const res = await fetch('/api/brain-gym/cbt', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error('getCbtRecords error:', err);
    return [];
  }
}

export async function addCbtRecord(record: CbtRecord): Promise<boolean> {
  try {
    const res = await fetch('/api/brain-gym/cbt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch (err) {
    console.error('addCbtRecord error:', err);
    return false;
  }
}

export async function deleteCbtRecord(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/brain-gym/cbt?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('deleteCbtRecord error:', err);
    return false;
  }
}

export async function getNeuroHabits(): Promise<NeuroHabit[]> {
  try {
    const res = await fetch('/api/brain-gym/habits', { cache: 'no-store' });
    if (!res.ok) return DEFAULT_NEURO_HABITS;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return DEFAULT_NEURO_HABITS;
    return data;
  } catch (err) {
    console.error('getNeuroHabits error:', err);
    return DEFAULT_NEURO_HABITS;
  }
}

export async function saveNeuroHabit(habit: NeuroHabit): Promise<boolean> {
  try {
    const res = await fetch('/api/brain-gym/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(habit),
    });
    return res.ok;
  } catch (err) {
    console.error('saveNeuroHabit error:', err);
    return false;
  }
}

export async function getNeuroArticlesGlobal(): Promise<any[]> {
  try {
    const res = await fetch('/api/settings?id=neuro_articles');
    if (!res.ok) return DEFAULT_NEURO_ARTICLES;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : DEFAULT_NEURO_ARTICLES;
  } catch {
    return DEFAULT_NEURO_ARTICLES;
  }
}

export async function logBrainActivity(
  gameType: 'spatial_memory' | 'stroop_test' | 'math_speed',
  rawMetrics: Record<string, any>,
  normalizedScore: number | null
): Promise<boolean> {
  try {
    const res = await fetch('/api/brain-gym/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType, rawMetrics, normalizedScore }),
    });
    return res.ok;
  } catch (err) {
    console.error('logBrainActivity error:', err);
    return false;
  }
}

export async function getAggregatedBrainMetrics(clientTodayStr?: string): Promise<AggregatedBrainMetrics | null> {
  try {
    const url = clientTodayStr
      ? `/api/brain-gym/activity?today=${encodeURIComponent(clientTodayStr)}`
      : '/api/brain-gym/activity';
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('getAggregatedBrainMetrics error:', err);
    return null;
  }
}