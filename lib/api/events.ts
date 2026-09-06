// lib/api/events.ts
import { CalendarEvent } from '@/components/Dashboard';

export async function getEvents(): Promise<CalendarEvent[] | null> {
  try {
    const res = await fetch('/api/events', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();

    return data.map((e: any) => {
      const startDate = new Date(e.startTime);
      return {
        id: e.id,
        title: e.title,
        desc: e.description || '',
        date: startDate.toISOString().split('T')[0],
        time: startDate.toISOString().split('T')[1]?.substring(0, 5) || '12:00',
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

    return {
      id: resData.id,
      title: resData.title,
      desc: resData.description || '',
      date: finalStartDate.toISOString().split('T')[0],
      time: finalStartDate.toISOString().split('T')[1]?.substring(0, 5) || '12:00',
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