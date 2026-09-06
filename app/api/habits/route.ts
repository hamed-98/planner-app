// app/api/habits/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت عادت‌ها به همراه لاگ‌های ثبت‌شده و استریک
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const habits = await db.habit.findMany({
      where: { userId: user.id },
      include: {
        logs: {
          where: { completed: true },
          select: { logDate: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const today = new Date().toISOString().split('T')[0];

    const mapped = habits.map((h) => {
      const completedDates = h.logs.map((l) => l.logDate);
      const sortedDates = [...completedDates].sort().reverse();

      // محاسبه استریک روزانه
      let streak = 0;
      let checkDate = new Date(today);

      if (sortedDates.includes(today)) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1);
        while (sortedDates.includes(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
        while (sortedDates.includes(checkDate.toISOString().split('T')[0])) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }

      return {
        id: h.id,
        name: h.title,
        streak,
        completedDates,
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Habits GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت عادت‌ها' }, { status: 500 });
  }
}

// ساخت یا ویرایش عادت (POST)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'نام عادت الزامی است' }, { status: 400 });
    }

    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    const db = getScopedDb(user.id);
    const habit = await db.habit.upsert({
      where: {
        id_userId: {
          id: targetId,
          userId: user.id,
        },
      },
      create: {
        id: targetId,
        userId: user.id,
        title: name.trim(),
      },
      update: {
        title: name.trim(),
      },
    });

    return NextResponse.json({
      id: habit.id,
      name: habit.title,
      streak: 0,
      completedDates: [],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Habits POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره عادت' }, { status: 500 });
  }
}

// تغییر وضعیت انجام عادت در یک تاریخ خاص (PATCH)
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { habitId, dateISO, completed } = body;

    if (!habitId || !dateISO) {
      return NextResponse.json({ error: 'پارامترهای عادت یا تاریخ ناقص است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);

    if (completed) {
      await db.habitLog.upsert({
        where: {
          habitId_logDate: {
            habitId,
            logDate: dateISO,
          },
        },
        create: {
          id: crypto.randomUUID(),
          userId: user.id,
          habitId,
          logDate: dateISO,
          completed: true,
        },
        update: {
          completed: true,
        },
      });
    } else {
      await db.habitLog.deleteMany({
        where: {
          habitId,
          logDate: dateISO,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Habit Log PATCH error:', error);
    return NextResponse.json({ error: error.message || 'خطا در تغییر وضعیت عادت' }, { status: 500 });
  }
}

// حذف عادت (DELETE)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه عادت ارسال نشده است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.habit.delete({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Habit DELETE error:', error);
    return NextResponse.json({ error: error.message || 'خطا در حذف عادت' }, { status: 500 });
  }
}