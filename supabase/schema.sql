-- جداول اصلی سایبان

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  theme text default 'system',
  language text default 'fa',
  calendar_type text default 'jalali',
  created_at timestamptz default now()
);

create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  priority text default 'medium',
  status text default 'todo',
  due_date date,
  estimated_minutes int,
  actual_minutes int,
  tags text[],
  created_at timestamptz default now()
);

create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  content text,
  folder text,
  tags text[],
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  color text,
  is_recurring boolean default false,
  recurrence_rule text,
  created_at timestamptz default now()
);

create table public.health_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null,
  water_ml int,
  sleep_hours numeric(4,2),
  sleep_quality int,
  mood int,
  weight_kg numeric(5,2),
  notes text,
  created_at timestamptz default now()
);

create table public.habits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  color text,
  created_at timestamptz default now()
);

create table public.habit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references public.habits(id) on delete cascade not null,
  log_date date not null,
  completed boolean default false
);

create table public.medicines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  dosage text,
  reminder_times text[],
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.events enable row level security;
alter table public.health_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.medicines enable row level security;

create policy "own profiles" on public.profiles for all using (auth.uid() = id);
create policy "own tasks" on public.tasks for all using (auth.uid() = user_id);
create policy "own notes" on public.notes for all using (auth.uid() = user_id);
create policy "own events" on public.events for all using (auth.uid() = user_id);
create policy "own health_logs" on public.health_logs for all using (auth.uid() = user_id);
create policy "own habits" on public.habits for all using (auth.uid() = user_id);
create policy "own habit_logs" on public.habit_logs for all using (auth.uid() = user_id);
create policy "own medicines" on public.medicines for all using (auth.uid() = user_id);

-- جداول باشگاه مغز و سلامت روان شناختی (Brain Gym & CBT)
create table if not exists public.brain_profiles (
  user_id uuid references auth.users(id) on delete cascade primary key,
  memory_score int default 0,
  flexibility_score int default 0,
  processing_speed int default 0,
  focus_energy int default 0,
  games_played int default 0,
  total_accuracies jsonb default '[]'::jsonb,
  reaction_times jsonb default '[]'::jsonb,
  streak_days int default 0,
  last_played_date text default '',
  unlocked_badges jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cbt_records (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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
  created_at timestamptz default now()
);

create table if not exists public.cbt_thought_records (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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
  created_at timestamptz default now()
);

create table if not exists public.neuro_habits (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  xp int default 15,
  is_custom boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.brain_profiles enable row level security;
alter table public.cbt_records enable row level security;
alter table public.cbt_thought_records enable row level security;
alter table public.neuro_habits enable row level security;

create policy "own brain_profiles" on public.brain_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cbt_records" on public.cbt_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own cbt_thought_records" on public.cbt_thought_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own neuro_habits" on public.neuro_habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ساخت خودکار پروفایل بعد از ثبتنام
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
