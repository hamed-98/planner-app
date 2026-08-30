import { createClient, handleSupabaseError } from './client';

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

export const DEFAULT_NEURO_ARTICLES = [
  {
    id: 'neuroplasticity',
    title: 'نوروپلاستیسیته: قابلیت بازسازی مداوم ساختار مغز',
    category: 'ساختار مغز',
    readTime: '۳ دقیقه',
    icon: '🧠',
    summary: 'مغز انسان تا آخرین لحظه عمر قادر به تغییر سیم‌کشی و ایجاد مسیرهای سیناپسی جدید است.',
    content: `نوروپلاستیسیته (Neuroplasticity) به توانایی شگفت‌انگیز مغز در بازسازی خود از طریق ایجاد اتصالات عصبی جدید در طول زندگی اشاره دارد. 
    هر بار که یادگیری جدیدی تجربه می‌کنید، نورون‌ها سیناپس‌های جدیدی تشکیل می‌دهند.
    
    📌 نکته کاربردی: تکرار و چالش دو کلید اصلی نوروپلاستیسیته هستند. اگر کاری بیش از حد آسان شود، سیناپس‌سازی متوقف می‌شود.`
  },
  {
    id: 'dopamine-fasting',
    title: 'سیستم دوپامین و مدیریت انگیزه',
    category: 'شیمی مغز',
    readTime: '۴ دقیقه',
    icon: '⚡',
    summary: 'چگونه از فرسودگی دیجیتال جلوگیری کنیم و حساسیت گیرنده‌های دوپامین D2 را بازگردانیم.',
    content: `دوپامین مولکول پیش‌بینی پاداش و انگیزه است. شبکه‌های اجتماعی گیرنده‌های دوپامین مغز را اشباع می‌کنند.
    
    📌 نکته کاربردی: با انجام روزانه ۶۰ دقیقه دوری از موبایل در ابتدای روز، حساسیت گیرنده‌ها بازمی‌گردد.`
  }
];

export const DEFAULT_NEURO_HABITS: NeuroHabit[] = [
  { id: '1', title: 'استفاده ۱۰ دقیقه‌ای از دست غیرمسلط (مسواک/نوشتن)', completed: false, xp: 15 },
  { id: '2', title: 'پیاده‌روی ۱۰ دقیقه‌ای بدون هندزفری و گوشی (مشاهده محیط)', completed: false, xp: 15 },
  { id: '3', title: 'یادگیری و یادداشت ۳ واژه یا مفهوم تخصصی جدید', completed: false, xp: 20 },
  { id: '4', title: 'دریافت ۱۰ دقیقه نور مستقیم خورشید اول صبح', completed: false, xp: 15 },
  { id: '5', title: 'حل حداقل یک تمرین یا بازی شناختی در باشگاه مغز', completed: false, xp: 20 }
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
  unlockedBadges: []
};

function parseNumberArray(val: any): number[] {
  if (Array.isArray(val)) return val.map(Number).filter(n => !isNaN(n));
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(Number).filter(n => !isNaN(n));
    } catch {
      const nums = val.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      if (nums.length > 0) return nums;
    }
  }
  return [];
}

function parseStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function getBrainProfile(): Promise<BrainProfile> {
  const supabase = createClient();
  let localProfile: BrainProfile | null = null;
  
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('sayeban_brain_profile');
      if (local) localProfile = JSON.parse(local);
    } catch (e) {
      console.warn('Error reading local brain profile:', e);
    }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localProfile || ZERO_BRAIN_PROFILE;

    const { data, error } = await (supabase as any)
      .from('brain_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Supabase getBrainProfile error:', error.message);
      return localProfile || ZERO_BRAIN_PROFILE;
    }

    if (data) {
      const dbAccuracies = parseNumberArray(data.total_accuracies);
      const dbReactions = parseNumberArray(data.reaction_times);
      const dbBadges = parseStringArray(data.unlocked_badges);

      const profile: BrainProfile = {
        memoryScore: Number(data.memory_score ?? 0),
        flexibilityScore: Number(data.flexibility_score ?? 0),
        processingSpeed: Number(data.processing_speed ?? 0),
        focusEnergy: Number(data.focus_energy ?? 0),
        gamesPlayed: Number(data.games_played ?? 0),
        totalAccuracies: dbAccuracies,
        reactionTimes: dbReactions,
        streakDays: Number(data.streak_days ?? 0),
        lastPlayedDate: data.last_played_date || '',
        unlockedBadges: dbBadges
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('sayeban_brain_profile', JSON.stringify(profile));
      }
      return profile;
    }
    return localProfile || ZERO_BRAIN_PROFILE;
  } catch (err) {
    console.error('getBrainProfile failed:', err);
    return localProfile || ZERO_BRAIN_PROFILE;
  }
}

export async function saveBrainProfile(profile: BrainProfile): Promise<boolean> {
  // ۱. ذخیره آنی در کش لوکال برای سرعت بالای رابط کاربری
  if (typeof window !== 'undefined') {
    localStorage.setItem('sayeban_brain_profile', JSON.stringify(profile));
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('saveBrainProfile: کاربر لاگین نیست.');
      return true;
    }

    const payload = {
      user_id: user.id,
      memory_score: profile.memoryScore,
      flexibility_score: profile.flexibilityScore,
      processing_speed: profile.processingSpeed,
      focus_energy: profile.focusEnergy,
      games_played: profile.gamesPlayed,
      total_accuracies: profile.totalAccuracies || [],
      reaction_times: profile.reactionTimes || [],
      streak_days: profile.streakDays || 0,
      last_played_date: profile.lastPlayedDate || new Date().toISOString().split('T')[0],
      unlocked_badges: profile.unlockedBadges || [],
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase as any)
      .from('brain_profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving brain profile to Supabase:', error.message);
      throw new Error(`خطا در همگام‌سازی ابری باشگاه مغز: ${error.message}`);
    }
    return true;
  } catch (err: any) {
    console.error('saveBrainProfile fatal error:', err);
    throw err;
  }
}

export async function getCbtRecords(): Promise<CbtRecord[]> {
  const supabase = createClient();
  let localCbts: CbtRecord[] = [];
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('sayeban_cbt_records');
    if (local) localCbts = JSON.parse(local);
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localCbts;

    const { data, error } = await (supabase as any)
      .from('cbt_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const records = data.map((item: any) => ({
        id: item.id,
        situation: item.situation || '',
        automaticThought: item.automatic_thought || '',
        initialBelief: item.initial_belief ?? 50,
        emotion: item.emotion || '',
        emotionIntensity: item.emotion_intensity ?? 50,
        distortion: item.distortion || '',
        evidenceFor: item.evidence_for || '',
        evidenceAgainst: item.evidence_against || '',
        reframedThought: item.reframed_thought || '',
        newBelief: item.new_belief ?? 50,
        date: item.created_at ? new Date(item.created_at).toLocaleDateString('fa-IR') : ''
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem('sayeban_cbt_records', JSON.stringify(records));
      }
      return records;
    }
    return localCbts;
  } catch (err) {
    return localCbts;
  }
}

export async function addCbtRecord(record: CbtRecord): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('sayeban_cbt_records');
    const existing = local ? JSON.parse(local) : [];
    localStorage.setItem('sayeban_cbt_records', JSON.stringify([record, ...existing]));
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;

    const payload = {
      id: record.id,
      user_id: user.id,
      situation: record.situation,
      automatic_thought: record.automaticThought,
      initial_belief: record.initialBelief,
      emotion: record.emotion,
      emotion_intensity: record.emotionIntensity,
      distortion: record.distortion,
      evidence_for: record.evidenceFor,
      evidence_against: record.evidenceAgainst,
      reframed_thought: record.reframedThought,
      new_belief: record.newBelief,
      created_at: new Date().toISOString()
    };

    await (supabase as any).from('cbt_records').upsert(payload, { onConflict: 'id' });
    return true;
  } catch (err) {
    return false;
  }
}

export async function deleteCbtRecord(id: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('sayeban_cbt_records');
    if (local) {
      const filtered = JSON.parse(local).filter((r: any) => r.id !== id);
      localStorage.setItem('sayeban_cbt_records', JSON.stringify(filtered));
    }
  }

  const supabase = createClient();
  try {
    await (supabase as any).from('cbt_records').delete().eq('id', id);
    return true;
  } catch {
    return false;
  }
}

export async function getNeuroHabits(): Promise<NeuroHabit[]> {
  const supabase = createClient();
  let localHabits: NeuroHabit[] = DEFAULT_NEURO_HABITS;
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('sayeban_neuro_habits_v2');
    if (local) {
      try {
        localHabits = JSON.parse(local);
      } catch {}
    }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return localHabits;

    const { data, error } = await (supabase as any)
      .from('neuro_habits')
      .select('*')
      .eq('user_id', user.id);

    if (error || !data || data.length === 0) {
      return localHabits;
    }

    const habitsMap = new Map<string, NeuroHabit>();
    data.forEach((item: any) => {
      habitsMap.set(item.id, {
        id: item.id,
        title: item.title,
        completed: !!item.completed,
        xp: item.xp || 15,
        isCustom: !!item.is_custom
      });
    });

    const merged: NeuroHabit[] = DEFAULT_NEURO_HABITS.map(def => {
      if (habitsMap.has(def.id)) {
        const dbItem = habitsMap.get(def.id)!;
        habitsMap.delete(def.id);
        return dbItem;
      }
      return def;
    });

    habitsMap.forEach(customH => merged.push(customH));

    if (typeof window !== 'undefined') {
      localStorage.setItem('sayeban_neuro_habits_v2', JSON.stringify(merged));
    }
    return merged;
  } catch (err) {
    return localHabits;
  }
}

export async function saveNeuroHabit(habit: NeuroHabit): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('sayeban_neuro_habits_v2');
    const habits: NeuroHabit[] = local ? JSON.parse(local) : DEFAULT_NEURO_HABITS;
    const exists = habits.some(h => h.id === habit.id);
    const updated = exists ? habits.map(h => h.id === habit.id ? habit : h) : [...habits, habit];
    localStorage.setItem('sayeban_neuro_habits_v2', JSON.stringify(updated));
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;

    const payload = {
      id: habit.id,
      user_id: user.id,
      title: habit.title,
      completed: habit.completed,
      xp: habit.xp,
      is_custom: !!habit.isCustom,
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabase as any)
      .from('neuro_habits')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('saveNeuroHabit Supabase notice:', error.message);
    }
    return true;
  } catch (err) {
    console.error('saveNeuroHabit error:', err);
    return false;
  }
}

export async function getNeuroArticlesGlobal(): Promise<any[]> {
  const supabase = createClient();
  try {
    const { data } = await (supabase as any)
      .from('global_settings')
      .select('value')
      .eq('id', 'neuro_articles')
      .maybeSingle();

    if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
      return data.value;
    }
  } catch (e) {}
  return DEFAULT_NEURO_ARTICLES;
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

// ۱. ثبت لاگ (با پذیرش مقدار null برای بازی‌های باطل‌شده)
export async function logBrainActivity(
  gameType: 'spatial_memory' | 'stroop_test' | 'math_speed',
  rawMetrics: Record<string, any>,
  normalizedScore: number | null
): Promise<boolean> {
  const cleanScore = normalizedScore !== null 
    ? Math.max(0, Math.min(100, Math.round(normalizedScore))) 
    : null;

  const logItem: BrainActivityLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'log_' + Date.now(),
    game_type: gameType,
    played_at: new Date().toISOString(),
    raw_metrics: rawMetrics,
    normalized_score: cleanScore
  };

  if (typeof window !== 'undefined') {
    try {
      const localLogs: BrainActivityLog[] = JSON.parse(localStorage.getItem('sayeban_brain_activity_logs') || '[]');
      localLogs.unshift(logItem);
      localStorage.setItem('sayeban_brain_activity_logs', JSON.stringify(localLogs.slice(0, 100)));
    } catch (e) {}
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;

    await (supabase.from('brain_activity_logs') as any).insert({
      user_id: user.id,
      game_type: gameType,
      played_at: logItem.played_at,
      raw_metrics: rawMetrics,
      normalized_score: cleanScore
    });

    return true;
  } catch (err) {
    return false;
  }
}

// ۲. محاسبه آمار (فیلتر کردن بازی‌های نامعتبر و محاسبه صرفاً بر اساس آزمون‌های معتبر)
export async function getAggregatedBrainMetrics(clientTodayStr?: string): Promise<AggregatedBrainMetrics> {
  const todayDate = clientTodayStr || new Date().toISOString().split('T')[0];
  const supabase = createClient();
  let logs: BrainActivityLog[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await (supabase.from('brain_activity_logs') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        logs = data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('sayeban_brain_activity_logs', JSON.stringify(data));
        }
      }
    }
  } catch {}

  if (logs.length === 0 && typeof window !== 'undefined') {
    try {
      logs = JSON.parse(localStorage.getItem('sayeban_brain_activity_logs') || '[]');
    } catch {}
  }

  const processGameType = (gType: 'spatial_memory' | 'stroop_test' | 'math_speed'): CognitiveMetricStatus => {
    const allGameLogs = logs.filter(l => l.game_type === gType);
    
    // فیلتر حیاتی: فقط لاگ‌هایی که معتبر هستند و نمره دارند وارد محاسبه عملکرد می‌شوند
    const validLogs = allGameLogs.filter(
      l => l.normalized_score !== null && 
           !l.raw_metrics?.status?.includes('invalid')
    );

    const recent20Valid = validLogs.slice(0, 20);
    const sampleSize = recent20Valid.length;

    // بازی‌های معتبر امروز
    const todayValidLogs = validLogs.filter(l => l.played_at && l.played_at.startsWith(todayDate));
    const todayAttempts = todayValidLogs.length;
    const todayScore = todayAttempts > 0
      ? Math.round(todayValidLogs.reduce((acc, curr) => acc + Number(curr.normalized_score), 0) / todayAttempts)
      : null;

    if (sampleSize < 3) {
      return {
        score: null,
        isCalibrating: true,
        sampleSize,
        todayScore,
        todayAttempts,
        lastPlayedAt: validLogs[0]?.played_at || null
      };
    }

    const rollingAvg = Math.round(recent20Valid.reduce((acc, curr) => acc + Number(curr.normalized_score), 0) / sampleSize);

    return {
      score: rollingAvg,
      isCalibrating: false,
      sampleSize,
      todayScore,
      todayAttempts,
      lastPlayedAt: validLogs[0]?.played_at || null
    };
  };

  const spatial = processGameType('spatial_memory');
  const stroop = processGameType('stroop_test');
  const math = processGameType('math_speed');

  const validRecentLogs = logs
    .filter(l => l.normalized_score !== null && !l.raw_metrics?.status?.includes('invalid'))
    .slice(0, 20);

  const reactions: number[] = [];
  validRecentLogs.forEach(l => {
    if (l.raw_metrics?.avg_reaction_ms) reactions.push(l.raw_metrics.avg_reaction_ms);
    if (l.raw_metrics?.avg_incongruent_ms) reactions.push(l.raw_metrics.avg_incongruent_ms);
  });

  const avgReactionTimeMs = reactions.length > 0 
    ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) 
    : null;

  const validScores = [spatial.score, stroop.score, math.score].filter((s): s is number => s !== null);
  const accuracyRate = validScores.length > 0 
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) 
    : null;

  const overallIndex = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : null;

  return {
    spatialMemory: spatial,
    stroopFlexibility: stroop,
    mathSpeed: math,
    avgReactionTimeMs,
    accuracyRate,
    overallIndex,
    totalGamesAllTime: logs.length
  };
}