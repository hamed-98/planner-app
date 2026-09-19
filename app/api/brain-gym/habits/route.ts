// app/api/brain-gym/habits/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const habits = await db.neuroHabit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    // حذف پیشوند اختصاصی کاربر در زمان ارسال به فرانت‌اند
    const sanitized = habits.map((h) => ({
      ...h,
      id: h.id.startsWith(`${user.id}_`) ? h.id.slice(user.id.length + 1) : h.id,
    }));

    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('NeuroHabit GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت عادت‌های عصبی' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, completed, xp, isCustom } = body;

    const rawId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    // برای شناسه‌های پیش‌فرض ۱ تا ۵، شناسه کاربر را پیشوند می‌کنیم تا در کلید اصلی دیتابیس تداخل نکنند
    const isDefault = ['1', '2', '3', '4', '5'].includes(rawId) || rawId.startsWith(`${user.id}_`);
    const cleanId = rawId.startsWith(`${user.id}_`) ? rawId.slice(user.id.length + 1) : rawId;
    const dbId = isDefault ? `${user.id}_${cleanId}` : cleanId;

    const db = getScopedDb(user.id);
    const habit = await db.neuroHabit.upsert({
      where: {
        id_userId: {
          id: dbId,
          userId: user.id,
        },
      },
      create: {
        id: dbId,
        userId: user.id,
        title: title || 'عادت جدید',
        completed: !!completed,
        xp: Number(xp || 15),
        isCustom: !!isCustom,
      },
      update: {
        title: title !== undefined ? title : undefined,
        completed: completed !== undefined ? Boolean(completed) : undefined,
        xp: xp !== undefined ? Number(xp) : undefined,
      },
    });

    return NextResponse.json({
      ...habit,
      id: cleanId,
    });
  } catch (error: any) {
    console.error('NeuroHabit POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره عادت عصبی' }, { status: 500 });
  }
}