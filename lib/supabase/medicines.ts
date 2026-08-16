import { createClient, handleSupabaseError } from './client';
import { Medicine } from '../../components/Dashboard';

export async function getMedicines() {
  const supabase = createClient();
  const { data, error } = await supabase.from('medicines').select('*');
  if (error) {
    handleSupabaseError('getMedicines', error);
    return null;
  }
  
  return (data as any[]).map(m => ({
    id: m.id,
    name: m.name,
    dosage: m.dosage || '',
    time: m.reminder_times?.[0] || '12:00',
    completedDates: [] // Schema doesn't track medicine logs right now, UI handles locally or ignores
  })) as Medicine[];
}

export async function addMedicine(med: Medicine) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload: any = {
    id: med.id,
    user_id: user.id,
    name: med.name,
    dosage: med.dosage,
    reminder_times: [med.time]
  };
  const { data, error } = await supabase.from('medicines').upsert(payload).select().single();

  if (error) {
    console.error('Error adding medicine:', error);
    return null;
  }

  const resData = data as any;
  return {
    id: resData.id,
    name: resData.name,
    dosage: resData.dosage || '',
    time: resData.reminder_times?.[0] || '12:00',
    completedDates: []
  } as Medicine;
}

export async function deleteMedicine(id: string) {
  const supabase = createClient();
  await supabase.from('medicines').delete().eq('id', id);
}
