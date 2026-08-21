-- ==============================================================================
-- پایگاه داده جامع و یکپارچه سایبان (Sayeban Database Schema)
-- ==============================================================================

-- ۱. فعال‌سازی اکستنشن‌های مورد نیاز
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ۲. جدول پروفایل کاربران (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'fa',
  calendar_type TEXT DEFAULT 'jalali',
  role TEXT DEFAULT 'user', -- 'user' | 'superadmin'
  plan TEXT DEFAULT 'free', -- 'free' | 'pro' | 'team'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۳. تابع بررسی دسترسی ادمین ارشد (جلوگیری از لوپ در پالیسی‌ها)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ۴. ساخت خودکار پروفایل بلافاصله پس از ثبت‌نام کاربر در Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'کاربر سایبان'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ۵. جدول تسک‌ها و مدیریت وظایف (Tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  status TEXT DEFAULT 'todo', -- 'todo' | 'doing' | 'done'
  due_date DATE,
  estimated_minutes INT,
  actual_minutes INT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۶. جدول یادداشت‌ها (Notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT,
  folder TEXT DEFAULT 'یادداشت‌ها',
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۷. جدول رویدادهای تقویم (Events)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  color TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۸. جدول لاگ‌های روزانه سلامت (Health Logs)
CREATE TABLE IF NOT EXISTS public.health_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  water_ml INT DEFAULT 0,
  sleep_hours NUMERIC(4,2) DEFAULT 7,
  sleep_quality INT DEFAULT 3,
  mood INT DEFAULT 3,
  weight_kg NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_daily_log UNIQUE (user_id, log_date)
);

-- ۹. جدول عادات روزانه (Habits & Habit Logs)
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_user_habit_daily UNIQUE (user_id, habit_id, log_date)
);

-- ۱۰. جدول داروها و مکمل‌ها (Medicines)
CREATE TABLE IF NOT EXISTS public.medicines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,
  reminder_times TEXT[],
  completed_dates TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۱۱. جداول باشگاه مغز (Brain Gym)
CREATE TABLE IF NOT EXISTS public.brain_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_score INT DEFAULT 0,
  flexibility_score INT DEFAULT 0,
  processing_speed INT DEFAULT 0,
  focus_energy INT DEFAULT 0,
  games_played INT DEFAULT 0,
  total_accuracies JSONB DEFAULT '[]'::jsonb,
  reaction_times JSONB DEFAULT '[]'::jsonb,
  streak_days INT DEFAULT 0,
  last_played_date TEXT DEFAULT '',
  unlocked_badges JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cbt_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  situation TEXT NOT NULL,
  automatic_thought TEXT NOT NULL,
  initial_belief INT DEFAULT 50,
  emotion TEXT NOT NULL,
  emotion_intensity INT DEFAULT 50,
  distortion TEXT NOT NULL,
  evidence_for TEXT DEFAULT '',
  evidence_against TEXT DEFAULT '',
  reframed_thought TEXT NOT NULL,
  new_belief INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.neuro_habits (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  xp INT DEFAULT 15,
  is_custom BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ۱۲. سیستم تیکتینگ و پشتیبانی (Tickets & Messages)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'open' NOT NULL,
  priority TEXT DEFAULT 'medium' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ۱۳. تنظیمات سراسری و لاگ‌های ادمین
CREATE TABLE IF NOT EXISTS public.global_settings (
  id TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- تنظیمات امنیت سطح سطر (Row Level Security - RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brain_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neuro_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- پالیسی‌های کاربران عادی
CREATE POLICY "Users manage own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own events" ON public.events FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own health" ON public.health_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own habit_logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own medicines" ON public.medicines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own brain_profile" ON public.brain_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own cbt_records" ON public.cbt_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own neuro_habits" ON public.neuro_habits FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own tickets" ON public.tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own ticket messages" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()) OR public.is_superadmin()
);
CREATE POLICY "Users insert ticket messages" ON public.ticket_messages FOR INSERT WITH CHECK (
  (EXISTS (SELECT 1 FROM public.tickets WHERE tickets.id = ticket_messages.ticket_id AND tickets.user_id = auth.uid()) AND sender_id = auth.uid()) OR public.is_superadmin()
);

-- پالیسی‌های ادمین ارشد (Superadmin)
CREATE POLICY "Superadmin view all profiles" ON public.profiles FOR SELECT USING (public.is_superadmin());
CREATE POLICY "Superadmin update all profiles" ON public.profiles FOR UPDATE USING (public.is_superadmin());
CREATE POLICY "Superadmin view all tickets" ON public.tickets FOR SELECT USING (public.is_superadmin());
CREATE POLICY "Superadmin update all tickets" ON public.tickets FOR UPDATE USING (public.is_superadmin());
CREATE POLICY "Superadmin manage global_settings" ON public.global_settings FOR ALL USING (public.is_superadmin());
CREATE POLICY "Superadmin manage admin_logs" ON public.admin_logs FOR ALL USING (public.is_superadmin());
CREATE POLICY "Allow public read for landing settings" ON public.global_settings FOR SELECT USING (id IN ('landing_page', 'announcements', 'neuro_articles'));