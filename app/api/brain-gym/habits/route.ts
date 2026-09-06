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

    return NextResponse.json(habits);
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

    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    const db = getScopedDb(user.id);
    const habit = await db.neuroHabit.upsert({
      where: {
        id_userId: {
          id: targetId,
          userId: user.id,
        },
      },
      create: {
        id: targetId,
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

    return NextResponse.json(habit);
  } catch (error: any) {
    console.error('NeuroHabit POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره عادت عصبی' }, { status: 500 });
  }
}