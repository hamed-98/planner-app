// lib/api/health.ts
import { HealthMetrics } from '@/components/Dashboard';

export async function getHealthLogs() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((item: any) => ({
      id: item.id,
      log_date: item.logDate,
      water_ml: item.waterMl,
      sleep_hours: item.sleepHours ? Number(item.sleepHours) : 0,
      sleep_quality: item.sleepQuality,
      mood: item.mood,
      weight_kg: item.weightKg ? Number(item.weightKg) : null,
      notes: item.notes,
    }));
  } catch (err) {
    console.error('API getHealthLogs error:', err);
    return null;
  }
}

export async function saveHealthLog(dateISO: string, metrics: Partial<HealthMetrics>) {
  try {
    const sleepQualityMap: Record<string, number> = { poor: 1, fair: 2, good: 3, excellent: 4 };

    const payload: any = { logDate: dateISO };
    if (metrics.waterToday !== undefined) payload.waterMl = metrics.waterToday;
    if (metrics.sleepHours !== undefined) payload.sleepHours = metrics.sleepHours;
    if (metrics.sleepQuality !== undefined) {
      payload.sleepQuality = sleepQualityMap[metrics.sleepQuality] || 3;
    }
    if (metrics.moodScore !== undefined) payload.mood = metrics.moodScore;
    if (metrics.weight !== undefined) payload.weightKg = metrics.weight;

    const res = await fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API saveHealthLog error:', err);
    return null;
  }
}