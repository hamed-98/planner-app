// app/api/events/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت تمام رویدادهای کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const events = await db.event.findMany({
      where: { userId: user.id },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error: any) {
    console.error('Events GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت رویدادها' }, { status: 500 });
  }
}

// ساخت یا به‌روزرسانی رویداد (POST)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, description, date, time, category, recurrence } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'عنوان رویداد الزامی است' }, { status: 400 });
    }

    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();
    const eventDate = date || new Date().toISOString().split('T')[0];
    const eventTime = time || '12:00';

    // تبدیل به فرمت استاندارد تاریخ با پسوند Z جهت پیشگیری از تغییر روز در اختلاف تایم‌زون
    const startTime = new Date(`${eventDate}T${eventTime}:00Z`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // پیش‌فرض ۱ ساعت

    const db = getScopedDb(user.id);
    const event = await db.event.upsert({
      where: {
        id_userId: {
          id: targetId,
          userId: user.id,
        },
      },
      create: {
        id: targetId,
        userId: user.id,
        title: title.trim(),
        description: description || '',
        startTime,
        endTime,
        color: category || 'personal',
        isRecurring: recurrence && recurrence !== 'none',
        recurrenceRule: recurrence || 'none',
      },
      update: {
        title: title.trim(),
        description: description !== undefined ? description : undefined,
        startTime,
        endTime,
        color: category || undefined,
        isRecurring: recurrence !== undefined ? recurrence !== 'none' : undefined,
        recurrenceRule: recurrence || undefined,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error('Events POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره رویداد' }, { status: 500 });
  }
}

// حذف رویداد (DELETE)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه رویداد ارسال نشده است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.event.delete({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Events DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'رویداد یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'خطا در حذف' }, { status: 500 });
  }
}