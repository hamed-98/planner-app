// app/api/medicines/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت داروها
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const medicines = await db.medicine.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    const mapped = medicines.map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage || '',
      time: m.reminderTimes[0] || '12:00',
      completedDates: m.completedDates || [],
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('Medicines GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت داروها' }, { status: 500 });
  }
}

// ساخت یا ویرایش کامل دارو (POST)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, name, dosage, time, completedDates } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'نام دارو الزامی است' }, { status: 400 });
    }

    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    const db = getScopedDb(user.id);
    const med = await db.medicine.upsert({
      where: {
        id_userId: {
          id: targetId,
          userId: user.id,
        },
      },
      create: {
        id: targetId,
        userId: user.id,
        name: name.trim(),
        dosage: dosage || '',
        reminderTimes: time ? [time] : ['12:00'],
        completedDates: Array.isArray(completedDates) ? completedDates : [],
      },
      update: {
        name: name.trim(),
        dosage: dosage !== undefined ? dosage : undefined,
        reminderTimes: time ? [time] : undefined,
        completedDates: Array.isArray(completedDates) ? completedDates : undefined,
      },
    });

    return NextResponse.json({
      id: med.id,
      name: med.name,
      dosage: med.dosage || '',
      time: med.reminderTimes[0] || '12:00',
      completedDates: med.completedDates || [],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Medicines POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره دارو' }, { status: 500 });
  }
}

// ثبت تاریخ مصرف دارو (PATCH)
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, completedDates } = body;

    if (!id || !Array.isArray(completedDates)) {
      return NextResponse.json({ error: 'شناسه یا تاریخچه نامعتبر است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.medicine.update({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
      data: {
        completedDates,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Medicine Log PATCH error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ثبت تاریخچه مصرف' }, { status: 500 });
  }
}

// حذف دارو (DELETE)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه دارو ارسال نشده است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.medicine.delete({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Medicine DELETE error:', error);
    return NextResponse.json({ error: error.message || 'خطا در حذف دارو' }, { status: 500 });
  }
}