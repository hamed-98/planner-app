import { createClient, handleSupabaseError } from './client';
import { HealthMetrics } from '../../components/Dashboard';

export async function getHealthLogs() {
  const supabase = createClient();
  const { data, error } = await (supabase.from('health_logs') as any).select('*');
  if (error) {
    handleSupabaseError('getHealthLogs', error);
    return null;
  }
  return data as any[];
}

export async function saveHealthLog(dateISO: string, metrics: Partial<HealthMetrics>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sleepQualityMap: Record<string, number> = { 'poor': 1, 'fair': 2, 'good': 3, 'excellent': 4 };

  const payload: any = {
    user_id: user.id,
    log_date: dateISO,
  };

  if (metrics.waterToday !== undefined) payload.water_ml = metrics.waterToday;
  if (metrics.sleepHours !== undefined) payload.sleep_hours = metrics.sleepHours;
  if (metrics.sleepQuality !== undefined) payload.sleep_quality = sleepQualityMap[metrics.sleepQuality] || 3;
  if (metrics.moodScore !== undefined) payload.mood = metrics.moodScore;
  if (metrics.weight !== undefined) payload.weight_kg = metrics.weight;

  // روش اول: تلاش برای Upsert سریع
  const { data: upsertData, error: upsertError } = await (supabase.from('health_logs') as any)
    .upsert(payload, { onConflict: 'user_id,log_date' })
    .select()
    .maybeSingle();

  if (!upsertError) {
    return upsertData;
  }

  // روش دوم (Fallback امن): در صورت عدم وجود Constraint، رکورد بررسی و سپس آپدیت/اینسرت می‌شود
  try {
    const { data: existing } = await (supabase.from('health_logs') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('log_date', dateISO)
      .maybeSingle();

    if (existing && existing.id) {
      const { data: updateData, error: updateError } = await (supabase.from('health_logs') as any)
        .update(payload)
        .eq('id', existing.id)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating health log:', updateError.message || updateError);
        return null;
      }
      return updateData;
    } else {
      const { data: insertData, error: insertError } = await (supabase.from('health_logs') as any)
        .insert(payload)
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Error inserting health log:', insertError.message || insertError);
        return null;
      }
      return insertData;
    }
  } catch (err: any) {
    console.error('Unexpected error in saveHealthLog:', err?.message || err);
    return null;
  }
}