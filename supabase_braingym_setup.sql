-- ==============================================================================
-- اسکریپت راه‌اندازی و به‌روزرسانی جداول بخش باشگاه مغز و CBT (Brain Gym) در Supabase
-- ==============================================================================
-- این دستورات را در بخش SQL Editor در داشبورد Supabase اجرا کنید (Run).
-- این اسکریپت بدون حذف داده‌های قبلی، ستون‌های ناموجود را اضافه و ساختار را هماهنگ می‌کند.

-- 1. جدول پروفایل و امتیازات باشگاه مغز (brain_profiles)
CREATE TABLE IF NOT EXISTS public.brain_profiles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  memory_score int DEFAULT 0,
  flexibility_score int DEFAULT 0,
  processing_speed int DEFAULT 0,
  focus_energy int DEFAULT 0,
  games_played int DEFAULT 0,
  total_accuracies jsonb DEFAULT '[]'::jsonb,
  reaction_times jsonb DEFAULT '[]'::jsonb,
  streak_days int DEFAULT 0,
  last_played_date text DEFAULT '',
  unlocked_badges jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- اطمینان از وجود تمام ستون‌ها در صورت وجود جدول از قبل
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS memory_score int DEFAULT 0;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS flexibility_score int DEFAULT 0;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS processing_speed int DEFAULT 0;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS focus_energy int DEFAULT 0;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS games_played int DEFAULT 0;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS total_accuracies jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS reaction_times jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS streak_days int DEFAULT 0;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS last_played_date text DEFAULT '';
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS unlocked_badges jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.brain_profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. جدول چرخه‌ها و تمرین‌های بازسازی شناختی CBT (cbt_records)
CREATE TABLE IF NOT EXISTS public.cbt_records (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  situation text,
  automatic_thought text,
  initial_belief int,
  emotion text,
  emotion_intensity int,
  distortion text,
  evidence_for text,
  evidence_against text,
  reframed_thought text,
  new_belief int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS situation text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS automatic_thought text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS initial_belief int;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS emotion text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS emotion_intensity int;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS distortion text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS evidence_for text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS evidence_against text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS reframed_thought text;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS new_belief int;
ALTER TABLE public.cbt_records ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- جدول کمکی cbt_thought_records در صورتی که با این نام ساخته شده باشد
CREATE TABLE IF NOT EXISTS public.cbt_thought_records (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  situation text,
  automatic_thought text,
  initial_belief int,
  emotion text,
  emotion_intensity int,
  distortion text,
  evidence_for text,
  evidence_against text,
  reframed_thought text,
  new_belief int,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS situation text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS automatic_thought text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS initial_belief int;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS emotion text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS emotion_intensity int;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS distortion text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS evidence_for text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS evidence_against text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS reframed_thought text;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS new_belief int;
ALTER TABLE public.cbt_thought_records ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. جدول عادات نورونی و ماموریت‌های روزانه (neuro_habits)
CREATE TABLE IF NOT EXISTS public.neuro_habits (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  completed boolean DEFAULT false,
  xp int DEFAULT 15,
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.neuro_habits ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.neuro_habits ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;
ALTER TABLE public.neuro_habits ADD COLUMN IF NOT EXISTS xp int DEFAULT 15;
ALTER TABLE public.neuro_habits ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false;
ALTER TABLE public.neuro_habits ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. فعال‌سازی دسترسی‌های امنیتی Row Level Security (RLS)
ALTER TABLE public.brain_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_thought_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuro_habits ENABLE ROW LEVEL SECURITY;

-- تنظیم Policies
DROP POLICY IF EXISTS "own brain_profiles" ON public.brain_profiles;
CREATE POLICY "own brain_profiles" ON public.brain_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own cbt_records" ON public.cbt_records;
CREATE POLICY "own cbt_records" ON public.cbt_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own cbt_thought_records" ON public.cbt_thought_records;
CREATE POLICY "own cbt_thought_records" ON public.cbt_thought_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own neuro_habits" ON public.neuro_habits;
CREATE POLICY "own neuro_habits" ON public.neuro_habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- بازخوانی Schema Cache در صورت نیاز
NOTIFY pgrst, 'reload schema';
