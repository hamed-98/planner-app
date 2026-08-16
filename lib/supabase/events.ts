import { createClient, handleSupabaseError } from './client';
import { CalendarEvent } from '../../components/Dashboard';

export async function getEvents() {
  const supabase = createClient();
  const { data, error } = await supabase.from('events').select('*');
  if (error) {
    handleSupabaseError('getEvents', error);
    return null;
  }
  return (data as any[]).map(e => {
    const startDate = new Date(e.start_time);
    return {
      id: e.id,
      title: e.title,
      desc: e.description || '',
      date: startDate.toISOString().split('T')[0],
      time: startDate.toISOString().split('T')[1]?.substring(0, 5) || '12:00',
      category: e.color || 'personal',
      recurrence: e.recurrence_rule || 'none'
    };
  }) as CalendarEvent[];
}

export async function addEvent(event: CalendarEvent) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const startTime = new Date(`${event.date}T${event.time}:00Z`).toISOString();
  // We'll just set end_time to +1 hour for simplistic mapping
  const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

  const payload: any = {
    id: event.id,
    user_id: user.id,
    title: event.title,
    description: event.desc,
    start_time: startTime,
    end_time: endTime,
    color: event.category,
    is_recurring: event.recurrence !== 'none',
    recurrence_rule: event.recurrence
  };
  const { data, error } = await supabase.from('events').upsert(payload).select().single();

  if (error) {
    console.error('Error adding event:', error);
    return null;
  }
  
  const resData = data as any;
  const finalStartDate = new Date(resData.start_time);
  return {
    id: resData.id,
    title: resData.title,
    desc: resData.description || '',
    date: finalStartDate.toISOString().split('T')[0],
    time: finalStartDate.toISOString().split('T')[1]?.substring(0, 5) || '12:00',
    category: resData.color || 'personal',
    recurrence: resData.recurrence_rule || 'none'
  } as CalendarEvent;
}

export async function deleteEvent(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) {
    console.error('Error deleting event:', error);
    return false;
  }
  return true;
}
