// lib/api/events.ts
import { CalendarEvent } from '@/components/Dashboard';
import { getLocalDateString, getLocalTimeString } from '@/lib/utils/timezone';

// تایم‌زون واقعی مرورگر کاربر (نه ساعت خام UTC ذخیره‌شده در دیتابیس)
function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Tehran';
  } catch {
    return 'Asia/Tehran';
  }
}

export async function getEvents(): Promise<CalendarEvent[] | null> {
  try {
    const res = await fetch('/api/events', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    const tz = getBrowserTimeZone();

    return data.map((e: any) => {
      const startDate = new Date(e.startTime);
      // به‌جای خواندن اجزای خام UTC (که قبلاً باعث می‌شد رویداد با ساعتی متفاوت از چیزی که
      // کاربر واقعاً ثبت کرده بود نمایش داده شود)، همان زمان محلی واقعی کاربر نمایش داده می‌شود.
      return {
        id: e.id,
        title: e.title,
        desc: e.description || '',
        date: getLocalDateString(startDate, tz),
        time: getLocalTimeString(startDate, tz),
        category: e.color || 'personal',
        recurrence: e.recurrenceRule || 'none',
      };
    }) as CalendarEvent[];
  } catch (err) {
    console.error('API getEvents error:', err);
    return null;
  }
}

export async function addEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: event.id,
        title: event.title,
        description: event.desc,
        date: event.date,
        time: event.time,
        category: event.category,
        recurrence: event.recurrence,
      }),
    });
    if (!res.ok) return null;
    const resData = await res.json();
    const finalStartDate = new Date(resData.startTime);
    const tz = getBrowserTimeZone();

    return {
      id: resData.id,
      title: resData.title,
      desc: resData.description || '',
      date: getLocalDateString(finalStartDate, tz),
      time: getLocalTimeString(finalStartDate, tz),
      category: resData.color || 'personal',
      recurrence: resData.recurrenceRule || 'none',
    } as CalendarEvent;
  } catch (err) {
    console.error('API addEvent error:', err);
    return null;
  }
}

export async function deleteEvent(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/events?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('API deleteEvent error:', err);
    return false;
  }
}