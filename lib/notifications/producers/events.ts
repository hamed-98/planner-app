// lib/notifications/producers/events.ts
import { prisma } from '@/lib/db/prisma';
import { renderTemplate, DEFAULT_NOTIFICATION_POLICIES, NotificationPolicy } from '../template';

/**
 * تولیدکننده صف اعلان‌های رویدادهای تقویم
 */
export async function produceEventNotifications(policies?: NotificationPolicy): Promise<number> {
  const policy = policies || DEFAULT_NOTIFICATION_POLICIES;
  if (!policy.channels.events.enabled) {
    return 0;
  }

  const offsetMinutes = policy.channels.events.offsetMinutes || 15;
  const template = policy.channels.events.template;
  const now = new Date();
  let createdCount = 0;

  // ۱. واکشی رویدادهای ۲۴ ساعت آینده برای کاربرانی که اشتراک وب‌پوش دارند
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const events = await prisma.event.findMany({
    where: {
      user: {
        pushSubscriptions: {
          some: {},
        },
      },
      startTime: {
        gte: new Date(now.getTime() - 10 * 60 * 1000), // شامل رویدادهایی که تازه شروع می‌شوند
        lte: windowEnd,
      },
    },
    include: {
      user: {
        include: {
          profile: true,
          pushSubscriptions: true,
        },
      },
    },
  });

  for (const event of events) {
    const user = event.user;
    if (!user || user.pushSubscriptions.length === 0) continue;

    // بررسی ترجیحات کاربر
    const prefs = user.profile?.notificationPrefs as Record<string, boolean> | null;
    if (prefs && prefs.events === false) {
      continue;
    }

    // زمان اجرای اعلان: offsetMinutes دقیقه قبل از شروع رویداد
    const runAt = new Date(event.startTime.getTime() - offsetMinutes * 60 * 1000);

    // محافظ کهنگی: اگر زمان ارسال بیش از ۵ دقیقه گذشته است
    if (runAt.getTime() < now.getTime() - 5 * 60 * 1000) {
      continue;
    }

    const dedupeKey = `events:${event.id}:${runAt.toISOString()}`;
    const renderedBody = renderTemplate(template, {
      title: event.title,
      offset: String(offsetMinutes),
    });

    const payload = {
      title: 'یادآوری رویداد تقویم 📅',
      body: renderedBody,
      icon: '/icons/icon-192.png',
      url: `/dashboard?tab=calendar&eventId=${event.id}`,
      payload: {
        channel: 'events',
        refId: event.id,
        dedupeKey,
        url: `/dashboard?tab=calendar&eventId=${event.id}`,
      },
    };

    try {
      await prisma.scheduledNotification.create({
        data: {
          userId: user.id,
          channel: 'events',
          refId: event.id,
          dedupeKey,
          payload,
          runAt,
          status: 'pending',
        },
      });
      createdCount++;
    } catch (err: any) {
      if (err.code !== 'P2002') {
        console.error(`[Event Producer] Error scheduling event ${event.id}:`, err);
      }
    }
  }

  return createdCount;
}
