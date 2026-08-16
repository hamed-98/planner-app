-- اسکریپت راه‌اندازی سیستم تیکت، گزارش مشکل و پیشنهاد در سوپابیس
-- کدهای زیر را کپی کرده و در بخش SQL Editor در پنل سوپابیس خود اجرا کنید.

-- ۱. ساخت جدول تیکت‌ها (Tickets)
create table if not exists public.tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text not null, -- 'bug' (گزارش مشکل), 'suggestion' (پیشنهاد), 'question' (سوال), 'other' (سایر)
  status text default 'open' not null, -- 'open' (باز), 'in_progress' (در حال بررسی), 'resolved' (حل شده), 'closed' (بسته شده)
  priority text default 'medium' not null, -- 'low' (کم), 'medium' (متوسط), 'high' (زیاد)
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ۲. ساخت جدول پیام‌های تیکت (Ticket Messages)
create table if not exists public.ticket_messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

-- ۳. فعال‌سازی امنیت سطح سطر (Row Level Security - RLS)
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- ۴. حذف سیاست‌های قدیمی در صورت وجود (پایداری و تکرارپذیری)
drop policy if exists "users can view their own tickets" on public.tickets;
drop policy if exists "users can insert their own tickets" on public.tickets;
drop policy if exists "users can update their own tickets" on public.tickets;
drop policy if exists "admins can view all tickets" on public.tickets;
drop policy if exists "admins can update any ticket" on public.tickets;

drop policy if exists "users can view messages of their own tickets" on public.ticket_messages;
drop policy if exists "users can insert messages into their own tickets" on public.ticket_messages;

-- ۵. ایجاد سیاست‌های دسترسی برای جدول تیکت‌ها (Tickets Policies)
create policy "users can view their own tickets"
  on public.tickets
  for select
  using (auth.uid() = user_id);

create policy "users can insert their own tickets"
  on public.tickets
  for insert
  with check (auth.uid() = user_id);

create policy "users can update their own tickets"
  on public.tickets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admins can view all tickets"
  on public.tickets
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

create policy "admins can update any ticket"
  on public.tickets
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- ۶. ایجاد سیاست‌های دسترسی برای جدول پیام‌ها (Ticket Messages Policies)
create policy "users can view messages of their own tickets"
  on public.ticket_messages
  for select
  using (
    exists (
      select 1 from public.tickets
      where tickets.id = ticket_messages.ticket_id and tickets.user_id = auth.uid()
    ) or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

create policy "users can insert messages into their own tickets"
  on public.ticket_messages
  for insert
  with check (
    (exists (
      select 1 from public.tickets
      where tickets.id = ticket_messages.ticket_id and tickets.user_id = auth.uid()
    ) and sender_id = auth.uid() and is_admin = false)
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );
