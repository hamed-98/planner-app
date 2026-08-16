import { createClient, handleSupabaseError } from './client';
import { Habit } from '../../components/Dashboard';

export async function getHabits() {
  const supabase = createClient();
  const { data: habitsData, error: habitsError } = await supabase.from('habits').select('*');
  const { data: logsData, error: logsError } = await supabase.from('habit_logs').select('*');
  
  if (habitsError || logsError) {
    handleSupabaseError('getHabits', habitsError || logsError);
    return null;
  }

  return (habitsData as any[]).map(h => {
    const logs = (logsData as any[]).filter(l => l.habit_id === h.id && l.completed);
    const completedDates = logs.map(l => l.log_date);
    
    // Very naive streak calculation for UI (could be optimized)
    let streak = 0;
    const sortedDates = completedDates.sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    let currentDate = new Date(today);
    
    if (sortedDates.includes(today)) {
       streak = 1;
       currentDate.setDate(currentDate.getDate() - 1);
       while (sortedDates.includes(currentDate.toISOString().split('T')[0])) {
         streak++;
         currentDate.setDate(currentDate.getDate() - 1);
       }
    } else {
       currentDate.setDate(currentDate.getDate() - 1);
       while (sortedDates.includes(currentDate.toISOString().split('T')[0])) {
         streak++;
         currentDate.setDate(currentDate.getDate() - 1);
       }
    }

    return {
      id: h.id,
      name: h.title,
      streak: streak,
      completedDates: completedDates
    } as Habit;
  });
}

export async function addHabit(id: string, name: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload: any = {
    id: id,
    user_id: user.id,
    title: name,
  };
  const { data, error } = await supabase.from('habits').upsert(payload).select().single();

  if (error) {
    console.error('Error adding habit:', error);
    return null;
  }

  const resData = data as any;
  return {
    id: resData.id,
    name: resData.title,
    streak: 0,
    completedDates: []
  } as Habit;
}

export async function deleteHabit(id: string) {
  const supabase = createClient();
  await supabase.from('habits').delete().eq('id', id);
}

export async function toggleHabitLog(habitId: string, dateISO: string, completed: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase.from('habit_logs').select('id').eq('habit_id', habitId).eq('log_date', dateISO).single();
  
  if (existing) {
    if (completed) {
      await (supabase.from('habit_logs') as any).update({ completed }).eq('id', (existing as any).id);
    } else {
      // It's sometimes better to delete or set to false
      await (supabase.from('habit_logs') as any).delete().eq('id', (existing as any).id);
    }
  } else if (completed) {
    const payload: any = {
      user_id: user.id,
      habit_id: habitId,
      log_date: dateISO,
      completed: true
    };
    await (supabase.from('habit_logs') as any).insert(payload);
  }
}
