// app/api/notifications/test-push/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';
import { webpush } from '@/lib/notifications/server';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: user.id },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'هیچ دستگاه یا اشتراک فعالی برای حساب شما یافت نشد. لطفاً ابتدا مجوز اعلان را در تنظیمات فعال کنید.' },
        { status: 404 }
      );
    }

    const testPayload = JSON.stringify({
      title: 'سایه‌بان | تست اعلان هوشمند 🔔',
      body: 'اتصال وب‌پوش با موفقیت برقرار شد و کلیدهای VAPID فعال هستند.',
      icon: '/icons/icon-192.png',
      payload: {
        url: '/dashboard',
        channel: 'test',
        timestamp: Date.now(),
      },
    });

    let sentCount = 0;
    const errors: any[] = [];

    for (const sub of subscriptions) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, testPayload);
        sentCount++;
      } catch (err: any) {
        console.error(`[Push Test] Error for endpoint ${sub.endpoint}:`, err.statusCode || err);
        // اگر دستگاه اشتراک را باطل کرده (404 یا 410)، رکورد آن را پاک می‌کنیم
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
        } else {
          errors.push(err.message || 'خطای ناشناخته');
        }
      }
    }

    if (sentCount === 0 && errors.length > 0) {
      return NextResponse.json({ error: 'ارسال اعلان با شکست مواجه شد', details: errors }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `اعلان تستی با موفقیت به ${sentCount} دستگاه ارسال گردید.`,
      sentCount,
    });
  } catch (error: any) {
    console.error('Test Push POST error:', error);
    return NextResponse.json({ error: 'خطا در شلیک اعلان آزمایشی' }, { status: 500 });
  }
}
