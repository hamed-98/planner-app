import { createClient, handleSupabaseError } from './client';
import { HealthMetrics } from '../../components/Dashboard';

export async function getHealthLogs() {
  const supabase = createClient();
  const { data, error } = await supabase.from('health_logs').select('*');
  if (error) {
    handleSupabaseError('getHealthLogs', error);
    return null;
  }
  return data as any;
}

export async function saveHealthLog(dateISO: string, metrics: Partial<HealthMetrics>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // First try to find existing log for the date
  const { data: existing } = await supabase.from('health_logs').select('id').eq('log_date', dateISO).single();

  const sleepQualityMap: Record<string, number> = { 'poor': 1, 'fair': 2, 'good': 3, 'excellent': 4 };

  const paylaod: any = {
    user_id: user.id,
    log_date: dateISO,
  };

  if (metrics.waterToday !== undefined) paylaod.water_ml = metrics.waterToday;
  if (metrics.sleepHours !== undefined) paylaod.sleep_hours = metrics.sleepHours;
  if (metrics.sleepQuality !== undefined) paylaod.sleep_quality = sleepQualityMap[metrics.sleepQuality] || 3;
  if (metrics.moodScore !== undefined) paylaod.mood = metrics.moodScore;
  if (metrics.weight !== undefined) paylaod.weight_kg = metrics.weight;
  
  if (existing) {
    const { data, error } = await (supabase.from('health_logs') as any).update(paylaod).eq('id', (existing as any).id).select().single();
    if (error) console.error('Error updating health:', error);
    return data as any;
  } else {
    const { data, error } = await (supabase.from('health_logs') as any).insert(paylaod).select().single();
    if (error) console.error('Error creating health:', error);
    return data as any;
  }
}
