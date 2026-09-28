// app/api/admin/notifications/stats/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم احراز هویت' }, { status: 401 });
  }

  // بررسی سطح دسترسی سوپرادمین
  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'عدم دسترسی مجاز' }, { status: 403 });
  }

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // واکشی همزمان شمارنده‌ها
    const [activeSubscriptions, deliveries] = await Promise.all([
      prisma.pushSubscription.count(),
      prisma.notificationDelivery.findMany({
        where: { deliveredAt: { gte: oneDayAgo } },
        select: { status: true },
      }),
    ]);

    let delivered24h = 0;
    let dropped24h = 0;
    let expired24h = 0;
    let failed24h = 0;

    for (const d of deliveries) {
      if (d.status === 'delivered') delivered24h++;
      else if (d.status === 'dropped_quiet_hours') dropped24h++;
      else if (d.status === 'expired') expired24h++;
      else if (d.status === 'failed') failed24h++;
    }

    return NextResponse.json({
      activeSubscriptions,
      delivered24h,
      dropped24h,
      expired24h,
      failed24h,
    });
  } catch (error: any) {
    console.error('[Admin Notification Stats Error]:', error);
    return NextResponse.json({ error: 'خطا در محاسبه آمار اعلان‌ها' }, { status: 500 });
  }
}