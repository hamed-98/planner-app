// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت تمام لاگ‌های سلامت کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const logs = await db.healthLog.findMany({
      where: { userId: user.id },
      orderBy: { logDate: 'asc' },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Health GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات سلامت' }, { status: 500 });
  }
}

// ثبت یا به‌روزرسانی لاگ سلامت یک روز مشخص (Upsert)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { logDate, waterMl, sleepHours, sleepQuality, mood, weightKg, notes } = body;

    if (!logDate || typeof logDate !== 'string') {
      return NextResponse.json({ error: 'تاریخ لاگ الزامی است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    const log = await db.healthLog.upsert({
      where: {
        userId_logDate: {
          userId: user.id,
          logDate: logDate.trim(),
        },
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        logDate: logDate.trim(),
        // اگر null یا undefined بود، null ذخیره شود، نه 0
        waterMl: waterMl !== undefined && waterMl !== null ? Number(waterMl) : null,
        sleepHours: sleepHours !== undefined && sleepHours !== null ? Number(sleepHours) : null,
        sleepQuality: sleepQuality !== undefined && sleepQuality !== null ? Number(sleepQuality) : 3,
        mood: mood !== undefined && mood !== null ? Number(mood) : 3,
        weightKg: weightKg !== undefined && weightKg !== null && Number(weightKg) > 0 ? Number(weightKg) : null,
        notes: notes || '',
      },
      update: {
        waterMl: waterMl !== undefined ? (waterMl === null ? null : Number(waterMl)) : undefined,
        sleepHours: sleepHours !== undefined ? (sleepHours === null ? null : Number(sleepHours)) : undefined,
        sleepQuality: sleepQuality !== undefined ? Number(sleepQuality) : undefined,
        mood: mood !== undefined ? Number(mood) : undefined,
        weightKg: weightKg !== undefined && Number(weightKg) > 0 ? Number(weightKg) : undefined,
      },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    console.error('Health POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره اطلاعات سلامت' }, { status: 500 });
  }
}