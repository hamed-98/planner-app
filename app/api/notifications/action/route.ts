// app/api/notifications/action/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, refId, channel } = body;

    if (!action || !refId) {
      return NextResponse.json({ error: 'پارامترهای اکشن ناقص است' }, { status: 400 });
    }

    // ۱. اکشن «مصرف کردم» (MARK_DONE)
    if (action === 'MARK_DONE' && (channel === 'medicines' || !channel)) {
      const medicine = await prisma.medicine.findUnique({
        where: {
          id_userId: {
            id: refId,
            userId: user.id,
          },
        },
      });

      if (!medicine) {
        return NextResponse.json({ error: 'دارو یافت نشد' }, { status: 404 });
      }

      // محاسبه تاریخ روز (YYYY-MM-DD) با تایمزون کاربر
      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      const tz = profile?.timezone || 'Asia/Tehran';
      const todayISO = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());

      // تضمین عدم ثبت تکراری تاریخ روز در آرایه
      const updatedDates = Array.from(new Set([...(medicine.completedDates || []), todayISO]));

      await prisma.medicine.update({
        where: {
          id_userId: {
            id: refId,
            userId: user.id,
          },
        },
        data: {
          completedDates: updatedDates,
        },
      });

      return NextResponse.json({ success: true, action: 'MARK_DONE', completedDates: updatedDates });
    }

    // ۲. اکشن «یادآوری ۱۰ دقیقه بعد» (SNOOZE_10)
    if (action === 'SNOOZE_10' && (channel === 'medicines' || !channel)) {
      const medicine = await prisma.medicine.findUnique({
        where: {
          id_userId: {
            id: refId,
            userId: user.id,
          },
        },
      });

      if (!medicine) {
        return NextResponse.json({ error: 'دارو یافت نشد' }, { status: 404 });
      }

      // ساخت کلید یکتا بر پایه دقیقه (مقاوم در برابر دبل‌کلیک یا تپ‌های سریع)
      const minuteBucket = Math.floor(Date.now() / 60000);
      const snoozeDedupeKey = `medicines:${refId}:snooze_${minuteBucket}`;
      const runAt = new Date(Date.now() + 10 * 60 * 1000);

      const payload = {
        title: `یادآوری مجدد دارو: ${medicine.name}`,
        body: `زمان مصرف داروی ${medicine.name} ${medicine.dosage || ''} (اسنوز ۱۰ دقیقه‌ای)`.trim(),
        icon: '/icons/icon-192.png',
        url: `/dashboard?action=med_done&id=${medicine.id}`,
        actions: [
          { action: 'MARK_DONE', title: 'مصرف کردم ✅' },
          { action: 'SNOOZE_10', title: '۱۰ دقیقه بعد ⏳' },
        ],
        payload: {
          channel: 'medicines',
          refId: medicine.id,
          dedupeKey: snoozeDedupeKey,
          url: `/dashboard?action=med_done&id=${medicine.id}`,
        },
      };

      try {
        await prisma.scheduledNotification.create({
          data: {
            userId: user.id,
            channel: 'medicines',
            refId: medicine.id,
            dedupeKey: snoozeDedupeKey,
            payload,
            runAt,
            status: 'pending',
          },
        });
      } catch (err: any) {
        // در صورت وجود رکورد تکراری با همین dedupeKey نادیده می‌گیریم
        if (err.code !== 'P2002') {
          throw err;
        }
      }

      return NextResponse.json({ success: true, action: 'SNOOZE_10', runAt });
    }

    return NextResponse.json({ error: 'اکشن پشتیبانی نمی‌شود' }, { status: 400 });
  } catch (error: any) {
    console.error('Notification action error:', error);
    return NextResponse.json({ error: 'خطا در پردازش اکشن اعلان' }, { status: 500 });
  }
}
