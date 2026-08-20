import { createClient, handleSupabaseError } from './client';
import { Medicine } from '../../components/Dashboard';

export async function getMedicines(): Promise<Medicine[] | null> {
  const supabase = createClient();
  
  let localMeds: Medicine[] = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('sayeban_medicines');
      if (saved) localMeds = JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading local medicines:', e);
    }
  }

  const { data, error } = await (supabase as any).from('medicines').select('*');
  if (error) {
    handleSupabaseError('getMedicines', error);
    return localMeds.length > 0 ? localMeds : null;
  }
  
  const localMap = new Map(localMeds.map(m => [m.id, m]));

  return (data as any[]).map(m => {
    const local = localMap.get(m.id);
    const dbDates = Array.isArray(m.completed_dates) ? m.completed_dates : [];
    const mergedDates = dbDates.length > 0 ? dbDates : (local?.completedDates || []);

    return {
      id: m.id,
      name: m.name,
      dosage: m.dosage || '',
      time: m.reminder_times?.[0] || '12:00',
      completedDates: mergedDates
    };
  }) as Medicine[];
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
    reminder_times: [med.time],
    completed_dates: med.completedDates || []
  };

  const { data, error } = await (supabase as any).from('medicines').upsert(payload).select().single();

  if (error) {
    console.error('Error adding/updating medicine:', error);
    return null;
  }

  const resData = data as any;
  return {
    id: resData.id,
    name: resData.name,
    dosage: resData.dosage || '',
    time: resData.reminder_times?.[0] || '12:00',
    completedDates: resData.completed_dates || med.completedDates || []
  } as Medicine;
}

export async function updateMedicineLog(id: string, completedDates: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await (supabase as any)
    .from('medicines')
    .update({ completed_dates: completedDates })
    .eq('id', id);

  if (error) {
    console.error('Error updating medicine log:', error);
  }
}

export async function deleteMedicine(id: string) {
  const supabase = createClient();
  await (supabase as any).from('medicines').delete().eq('id', id);
}