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
  initialBelief: number; // 0-100
  emotion: string;
  emotionIntensity: number; // 0-100
  distortion: string;
  evidenceFor: string;
  evidenceAgainst: string;
  reframedThought: string;
  newBelief: number; // 0-100
  date: string;
}

export interface NeuroHabit {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
  isCustom?: boolean;
}

// Default Neuroscience Articles
export const DEFAULT_NEURO_ARTICLES = [
  {
    id: 'neuroplasticity',
    title: 'نوروپلاستیسیته: قابلیت بازسازی مداوم ساختار مغز',
    category: 'ساختار مغز',
    readTime: '۳ دقیقه',
    icon: '🧠',
    summary: 'مغز انسان تا آخرین لحظه عمر قادر به تغییر سیم‌کشی و ایجاد مسیرهای سیناپسی جدید است.',
    content: `نوروپلاستیسیته (Neuroplasticity) به توانایی شگفت‌انگیز مغز در بازسازی خود از طریق ایجاد اتصالات عصبی جدید در طول زندگی اشاره دارد. 
    هر بار که یادگیری جدیدی تجربه می‌کنید، یادگیری یک زبان تازه، یک ابزار موسیقی یا الگوی فکری سالم، نورون‌ها سیناپس‌های جدیدی تشکیل می‌دهند.
    
    📌 نکته کاربردی: تکرار و چالش دو کلید اصلی نوروپلاستیسیته هستند. اگر کاری بیش از حد آسان شود، مغز روی «حالت خودکار» (Default Mode Network) رفته و سیناپس‌سازی متوقف می‌شود.`
  },
  {
    id: 'dopamine-fasting',
    title: 'سیستم دوپامین و مدیریت انگیزه',
    category: 'شیمی مغز',
    readTime: '۴ دقیقه',
    icon: '⚡',
    summary: 'چگونه از فرسودگی دیجیتال جلوگیری کنیم و حساسیت گیرنده‌های دوپامین D2 را بازگردانیم.',
    content: `دوپامین مولکول «پاداش» نیست، بلکه مولکول «پیش‌بینی پاداش و انگیزه» است. شبکه‌های اجتماعی با ارائه پاداش‌های متغیر، گیرنده‌های دوپامین مغز را اشباع می‌کنند.
    
    📌 نکته کاربردی: با انجام روزانه ۶۰ دقیقه «سم‌زدایی دوپامین» (دور ماندن از گوشی در ابتدای روز)، حساسیت گیرنده‌های مغزی بازگشته و کارهای عمیق دوباره لذت‌بخش می‌شوند.`
  },
  {
    id: 'decision-fatigue',
    title: 'خستگی تصمیم‌گیری (Decision Fatigue)',
    category: 'روانشناسی شناختی',
    readTime: '۳ دقیقه',
    icon: '⚖️',
    summary: 'قشر پیش‌پیشانی (Prefrontal Cortex) ظرفیت محدودی برای اخذ تصمیمات روزانه دارد.',
    content: `قشر پیش‌پیشانی مغز مسئول حل مسئله، کنترل تکانه و تصمیم‌گیری است. با هر تصمیمی که در طول روز می‌گیرید، گلوکز و انرژی شناختی این بخش کاهش می‌یابد.
    
    📌 نکته کاربردی: تصمیمات مهم و پرچالش را در ۲ ساعت اول صبح قرار دهید. برای تصمیمات کوچک (مانند وعده‌های غذایی)، روتین‌های ثابت ایجاد کنید.`
  },
  {
    id: 'sleep-consolidation',
    title: 'تثبیت حافظه و خواب REM و NREM',
    category: 'نوروساینس خواب',
    readTime: '۴ دقیقه',
    icon: '🌙',
    summary: 'بدون خواب کافی، اطلاعات ورودی از هیپوکامپ به قشر مغز منتقل نشده و فراموش می‌شوند.',
    content: `در طول خواب عمیق (Deep NREM)، هیپوکامپ تجربیات روز را به قشر خاکستری مغز منتقل می‌کند تا حافظه بلندمدت شکل گیرد. سپس در خواب REM، خلاقیت شکل می‌گیرد.
    
    📌 نکته کاربردی: ۷ تا ۸ ساعت خواب باکیفیت مؤثرترین ابزار برای تقویت حافظه و پاکسازی پروتئین‌های سمی بتاآمیلوئید است.`
  }
];

export const DEFAULT_NEURO_HABITS = [
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

// Helper to convert habit id to deterministic DB id
function getHabitDbId(userId: string, habitId: string): string {
  if (['1', '2', '3', '4', '5'].includes(habitId)) {
    if (userId.length === 36) {
      return userId.slice(0, 35) + habitId;
    }
    return `habit_${userId}_${habitId}`;
  }
  return habitId;
}

// Helper to extract missing column name from PostgREST schema cache errors (e.g. PGRST204)
function extractMissingColumn(error: any): string | null {
  if (!error) return null;
  const msg = (error.message || error.details || '') + ' ' + (typeof error === 'string' ? error : '');
  const match = msg.match(/Could not find the '([^']+)' column/i);
  if (match && match[1]) return match[1];
  return null;
}

// Helper to parse arrays from jsonb, json string or fallback
function parseNumberArray(val: any): number[] {
  if (Array.isArray(val)) {
    return val.map(Number).filter(n => !isNaN(n));
  }
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter(n => !isNaN(n));
      }
    } catch {
      // Not JSON, check if comma-separated
      const nums = val.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      if (nums.length > 0) return nums;
    }
  }
  return [];
}

function parseStringArray(val: any): string[] {
  if (Array.isArray(val)) {
    return val.map(String).filter(Boolean);
  }
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map(String).filter(Boolean);
      }
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

// --- BRAIN PROFILE SUPABASE HELPERS ---
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
    if (!user) {
      return localProfile || ZERO_BRAIN_PROFILE;
    }

    const { data, error } = await (supabase as any)
      .from('brain_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Error fetching brain profile from Supabase:', error);
    }

    const row = data as any;
    if (row) {
      const supabaseAccuracies = parseNumberArray(row.total_accuracies);
      const supabaseReactions = parseNumberArray(row.reaction_times);
      const supabaseBadges = parseStringArray(row.unlocked_badges);

      // Merge with localStorage if Supabase arrays are empty (e.g. before schema update)
      const mergedAccuracies = supabaseAccuracies.length > 0 
        ? supabaseAccuracies 
        : (localProfile?.totalAccuracies && localProfile.totalAccuracies.length > 0 ? localProfile.totalAccuracies : []);

      const mergedReactions = supabaseReactions.length > 0 
        ? supabaseReactions 
        : (localProfile?.reactionTimes && localProfile.reactionTimes.length > 0 ? localProfile.reactionTimes : []);

      const mergedBadges = supabaseBadges.length > 0 
        ? supabaseBadges 
        : (localProfile?.unlockedBadges && localProfile.unlockedBadges.length > 0 ? localProfile.unlockedBadges : []);

      const profile: BrainProfile = {
        memoryScore: Math.max(row.memory_score ?? 0, localProfile?.memoryScore ?? 0),
        flexibilityScore: Math.max(row.flexibility_score ?? 0, localProfile?.flexibilityScore ?? 0),
        processingSpeed: Math.max(row.processing_speed ?? 0, localProfile?.processingSpeed ?? 0),
        focusEnergy: Math.max(row.focus_energy ?? 0, localProfile?.focusEnergy ?? 0),
        gamesPlayed: Math.max(row.games_played ?? 0, localProfile?.gamesPlayed ?? 0),
        totalAccuracies: mergedAccuracies,
        reactionTimes: mergedReactions,
        streakDays: Math.max(row.streak_days ?? 0, localProfile?.streakDays ?? 0),
        lastPlayedDate: row.last_played_date || localProfile?.lastPlayedDate || '',
        unlockedBadges: mergedBadges
      };

      // Keep localStorage in sync
      if (typeof window !== 'undefined') {
        localStorage.setItem('sayeban_brain_profile', JSON.stringify(profile));
      }

      return profile;
    } else {
      // No Supabase row yet, return local profile or zero
      return localProfile || ZERO_BRAIN_PROFILE;
    }
  } catch (err) {
    console.error('getBrainProfile failed:', err);
    return localProfile || ZERO_BRAIN_PROFILE;
  }
}

export async function saveBrainProfile(profile: BrainProfile): Promise<boolean> {
  // Always update localStorage as immediate cache
  if (typeof window !== 'undefined') {
    localStorage.setItem('sayeban_brain_profile', JSON.stringify(profile));
  }

  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('saveBrainProfile: No active user logged in.');
      throw new Error('برای ذخیره دائمی در سوپابیس ابتدا باید وارد حساب کاربری شوید.');
    }

    let payload: Record<string, any> = {
      user_id: user.id,
      memory_score: profile.memoryScore,
      flexibility_score: profile.flexibilityScore,
      processing_speed: profile.processingSpeed,
      focus_energy: profile.focusEnergy,
      games_played: profile.gamesPlayed,
      total_accuracies: profile.totalAccuracies,
      reaction_times: profile.reactionTimes,
      streak_days: profile.streakDays,
      last_played_date: profile.lastPlayedDate,
      unlocked_badges: profile.unlockedBadges,
      updated_at: new Date().toISOString()
    };

    // Attempt save with automatic missing-column stripping loop
    let lastError: any = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      // 1. Try upsert
      const { error: upsertErr } = await (supabase as any)
        .from('brain_profiles')
        .upsert(payload, { onConflict: 'user_id' });

      if (!upsertErr) return true;

      const missingCol = extractMissingColumn(upsertErr);
      if (missingCol && payload[missingCol] !== undefined) {
        console.warn(`Column '${missingCol}' not found in brain_profiles table. Retrying without it...`);
        delete payload[missingCol];
        lastError = upsertErr;
        continue;
      }

      // 2. Fallback check & update or insert
      const { data: existing } = await (supabase as any)
        .from('brain_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error: updateErr } = await (supabase as any)
          .from('brain_profiles')
          .update(payload)
          .eq('user_id', user.id);

        if (!updateErr) return true;

        const missingColUp = extractMissingColumn(updateErr);
        if (missingColUp && payload[missingColUp] !== undefined) {
          delete payload[missingColUp];
          lastError = updateErr;
          continue;
        }
        lastError = updateErr;
      } else {
        const { error: insertErr } = await (supabase as any)
          .from('brain_profiles')
          .insert(payload);

        if (!insertErr) return true;

        const missingColIns = extractMissingColumn(insertErr);
        if (missingColIns && payload[missingColIns] !== undefined) {
          delete payload[missingColIns];
          lastError = insertErr;
          continue;
        }
        lastError = insertErr;
      }
      break;
    }

    if (lastError) {
      throw new Error(`خطا در ذخیره پروفایل: ${lastError.message} (کد ${lastError.code || 'ERR'})`);
    }

    return true;
  } catch (err: any) {
    console.error('saveBrainProfile error:', err);
    throw new Error(err.message || 'خطا در برقراری ارتباط با دیتابیس سوپابیس');
  }
}

// --- CBT RECORDS SUPABASE HELPERS ---
export async function getCbtRecords(): Promise<CbtRecord[]> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const local = typeof window !== 'undefined' ? localStorage.getItem('sayeban_cbt_records') : null;
      return local ? JSON.parse(local) : [];
    }

    // Try cbt_records first, fallback to cbt_thought_records
    let recordsData: any[] | null = null;
    let fetchError: any = null;

    const res1 = await (supabase as any)
      .from('cbt_records')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!res1.error && res1.data) {
      recordsData = res1.data;
    } else {
      fetchError = res1.error;
      // Try cbt_thought_records
      const res2 = await (supabase as any)
        .from('cbt_thought_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!res2.error && res2.data) {
        recordsData = res2.data;
      }
    }

    if (fetchError && !recordsData) {
      console.warn('Error fetching CBT records from Supabase:', fetchError);
    }

    if (recordsData && recordsData.length > 0) {
      return recordsData.map((item: any) => ({
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
    } else {
      return [];
    }
  } catch (err) {
    console.error('getCbtRecords error:', err);
    const local = typeof window !== 'undefined' ? localStorage.getItem('sayeban_cbt_records') : null;
    return local ? JSON.parse(local) : [];
  }
}

export async function addCbtRecord(record: CbtRecord): Promise<boolean> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('addCbtRecord: No active user logged in.');
      throw new Error('برای ثبت چرخه CBT باید ابتدا وارد حساب کاربری شوید.');
    }

    const recordId = record.id && record.id.length > 5 ? record.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cbt_' + Date.now());

    let payload: Record<string, any> = {
      id: recordId,
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

    // Try cbt_records first, if fails try cbt_thought_records
    const tablesToTry = ['cbt_records', 'cbt_thought_records'];
    let lastErr: any = null;

    for (const table of tablesToTry) {
      const { error: upsertErr } = await (supabase as any).from(table).upsert(payload);
      if (!upsertErr) return true;

      const missingCol = extractMissingColumn(upsertErr);
      if (missingCol && payload[missingCol] !== undefined) {
        delete payload[missingCol];
      }

      const { error: insertErr } = await (supabase as any).from(table).insert(payload);
      if (!insertErr) return true;
      lastErr = insertErr;
    }

    if (lastErr) {
      console.error('Error adding CBT record to Supabase:', lastErr);
      throw new Error(`خطا در ذخیره CBT: ${lastErr.message} (کد ${lastErr.code || 'ERR'})`);
    }
    return true;
  } catch (err: any) {
    console.error('addCbtRecord error:', err);
    throw new Error(err.message || 'خطا در ثبت چرخه CBT در سوپابیس');
  }
}

export async function deleteCbtRecord(id: string): Promise<boolean> {
  const supabase = createClient();
  try {
    // Delete from both possible tables
    await (supabase as any).from('cbt_records').delete().eq('id', id);
    await (supabase as any).from('cbt_thought_records').delete().eq('id', id);
    return true;
  } catch (err: any) {
    console.error('deleteCbtRecord error:', err);
    throw new Error(err.message || 'خطا در حذف ریکورد از سوپابیس');
  }
}

// --- NEURO HABITS SUPABASE HELPERS ---
export async function getNeuroHabits(): Promise<NeuroHabit[]> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const local = typeof window !== 'undefined' ? localStorage.getItem('sayeban_neuro_habits_v2') : null;
      return local ? JSON.parse(local) : DEFAULT_NEURO_HABITS;
    }

    const { data, error } = await (supabase as any)
      .from('neuro_habits')
      .select('*')
      .eq('user_id', user.id);

    if (error || !data) {
      if (error) handleSupabaseError('getNeuroHabits', error);
      return DEFAULT_NEURO_HABITS;
    }

    const habitsFromDbMap = new Map<string, NeuroHabit>();
    data.forEach((item: any) => {
      let cleanId = item.id;
      if (user.id.length === 36 && item.id.startsWith(user.id.slice(0, 35))) {
        cleanId = item.id.slice(35);
      } else if (cleanId.startsWith(`habit_${user.id}_`)) {
        cleanId = cleanId.replace(`habit_${user.id}_`, '');
      }

      habitsFromDbMap.set(cleanId, {
        id: cleanId,
        title: item.title,
        completed: !!item.completed,
        xp: item.xp || 15,
        isCustom: !!item.is_custom
      });
    });

    const merged: NeuroHabit[] = [];
    DEFAULT_NEURO_HABITS.forEach(def => {
      if (habitsFromDbMap.has(def.id)) {
        merged.push(habitsFromDbMap.get(def.id)!);
        habitsFromDbMap.delete(def.id);
      } else {
        merged.push(def);
      }
    });

    habitsFromDbMap.forEach(customH => merged.push(customH));

    return merged;
  } catch (err) {
    console.error('getNeuroHabits error:', err);
    const local = typeof window !== 'undefined' ? localStorage.getItem('sayeban_neuro_habits_v2') : null;
    return local ? JSON.parse(local) : DEFAULT_NEURO_HABITS;
  }
}

export async function saveNeuroHabit(habit: NeuroHabit): Promise<boolean> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('saveNeuroHabit: No active user logged in.');
      throw new Error('برای ذخیره عادات در سوپابیس ابتدا وارد حساب کاربری شوید.');
    }

    const dbId = getHabitDbId(user.id, habit.id);

    let payload: Record<string, any> = {
      id: dbId,
      user_id: user.id,
      title: habit.title,
      completed: habit.completed,
      xp: habit.xp,
      is_custom: !!habit.isCustom,
      updated_at: new Date().toISOString()
    };

    for (let attempt = 0; attempt < 4; attempt++) {
      const { error: upsertErr } = await (supabase as any).from('neuro_habits').upsert(payload);
      if (!upsertErr) return true;

      const missingCol = extractMissingColumn(upsertErr);
      if (missingCol && payload[missingCol] !== undefined) {
        delete payload[missingCol];
        continue;
      }

      const { data: existing } = await (supabase as any)
        .from('neuro_habits')
        .select('id')
        .eq('id', dbId)
        .maybeSingle();

      if (existing) {
        const { error: updateErr } = await (supabase as any)
          .from('neuro_habits')
          .update(payload)
          .eq('id', dbId);

        if (!updateErr) return true;
        const missingColUp = extractMissingColumn(updateErr);
        if (missingColUp && payload[missingColUp] !== undefined) {
          delete payload[missingColUp];
          continue;
        }
      } else {
        const { error: insertErr } = await (supabase as any)
          .from('neuro_habits')
          .insert(payload);

        if (!insertErr) return true;
        const missingColIns = extractMissingColumn(insertErr);
        if (missingColIns && payload[missingColIns] !== undefined) {
          delete payload[missingColIns];
          continue;
        }
      }
      break;
    }

    return true;
  } catch (err: any) {
    console.error('saveNeuroHabit error:', err);
    throw new Error(err.message || 'خطا در ذخیره عادت در سوپابیس');
  }
}

// --- GLOBAL ARTICLES FROM ADMIN ---
export async function getNeuroArticlesGlobal(): Promise<any[]> {
  const supabase = createClient();
  try {
    const { data } = await (supabase as any)
      .from('global_settings')
      .select('value')
      .eq('id', 'neuro_articles')
      .maybeSingle();

    const res = data as any;
    if (res && res.value && Array.isArray(res.value) && res.value.length > 0) {
      return res.value;
    }
  } catch (e) {
    console.error('getNeuroArticlesGlobal error:', e);
  }
  return DEFAULT_NEURO_ARTICLES;
}
