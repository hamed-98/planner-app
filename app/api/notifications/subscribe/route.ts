// app/api/notifications/subscribe/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import { isValidTimeZone } from '@/lib/notifications/template';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subscription, timezone } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'اطلاعات اشتراک ناقص است' }, { status: 400 });
    }

    const userAgent = req.headers.get('user-agent') || undefined;

    // ۱. ثبت یا به‌روزرسانی اشتراک کاربر (Upsert بر اساس endpoint یکتا)
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId: user.id,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        failureCount: 0,
      },
      create: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      },
    });

    // ۲. به‌روزرسانی تایمزون کاربر در صورت ارسال و معتبر بودن
    if (timezone && isValidTimeZone(timezone)) {
      await prisma.profile.updateMany({
        where: { id: user.id },
        data: { timezone },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscribe POST error:', error);
    return NextResponse.json({ error: 'خطا در ثبت اشتراک اعلان' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { endpoint } = body;

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Subscribe DELETE error:', error);
    return NextResponse.json({ error: 'خطا در لغو اشتراک' }, { status: 500 });
  }
}
