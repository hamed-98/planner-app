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
        waterMl: waterMl !== undefined ? Number(waterMl) : 0,
        sleepHours: sleepHours !== undefined ? Number(sleepHours) : 0,
        sleepQuality: sleepQuality !== undefined ? Number(sleepQuality) : 3,
        mood: mood !== undefined ? Number(mood) : 3,
        weightKg: weightKg !== undefined ? Number(weightKg) : 70,
        notes: notes || '',
      },
      update: {
        waterMl: waterMl !== undefined ? Number(waterMl) : undefined,
        sleepHours: sleepHours !== undefined ? Number(sleepHours) : undefined,
        sleepQuality: sleepQuality !== undefined ? Number(sleepQuality) : undefined,
        mood: mood !== undefined ? Number(mood) : undefined,
        weightKg: weightKg !== undefined ? Number(weightKg) : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(log);
  } catch (error: any) {
    console.error('Health POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره اطلاعات سلامت' }, { status: 500 });
  }
}