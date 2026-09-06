// lib/api/habits.ts
import { Habit } from '@/components/Dashboard';

export async function getHabits(): Promise<Habit[] | null> {
  try {
    const res = await fetch('/api/habits', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API getHabits error:', err);
    return null;
  }
}

export async function addHabit(id: string, name: string): Promise<Habit | null> {
  try {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API addHabit error:', err);
    return null;
  }
}

export async function toggleHabitLog(habitId: string, dateISO: string, completed: boolean) {
  try {
    await fetch('/api/habits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitId, dateISO, completed }),
    });
  } catch (err) {
    console.error('API toggleHabitLog error:', err);
  }
}

export async function deleteHabit(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/habits?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('API deleteHabit error:', err);
    return false;
  }
}