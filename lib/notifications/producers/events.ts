// lib/notifications/producers/events.ts
import { prisma } from '@/lib/db/prisma';
import { renderTemplate, DEFAULT_NOTIFICATION_POLICIES, NotificationPolicy } from '../template';

export async function produceEventNotifications(policies?: NotificationPolicy): Promise<number> {
  const policy = policies || DEFAULT_NOTIFICATION_POLICIES;
  if (!policy.channels.events.enabled) {
    return 0;
  }

  const offsetMinutes = policy.channels.events.offsetMinutes || 1;
  const template = policy.channels.events.template;
  const now = new Date();
  let createdCount = 0;

  // بازه جستجو: رویدادهایی که از ۱۰ دقیقه پیش تا ۲۴ ساعت آینده شروع می‌شوند
  const windowStart = new Date(now.getTime() - 10 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      user: {
        pushSubscriptions: {
          some: {},
        },
      },
      startTime: {
        gte: windowStart,
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

    const prefs = user.profile?.notificationPrefs as Record<string, boolean> | null;
    if (prefs && prefs.events === false) {
      continue;
    }

    const eventTimeMs = event.startTime.getTime();

    // اگر خود رویداد بیش از ۵ دقیقه قبل گذشته، رد شو
    if (eventTimeMs < now.getTime() - 5 * 60 * 1000) {
      continue;
    }

    // زمان اعلان: offsetMinutes قبل از شروع رویداد
    let runAt = new Date(eventTimeMs - offsetMinutes * 60 * 1000);

    // اگر زمان هشدار گذشته اما رویداد هنوز تمام نشده، در تیک جاری شلیک کن
    if (runAt.getTime() < now.getTime() && eventTimeMs >= now.getTime()) {
      runAt = new Date(now.getTime() - 1000);
    } else if (runAt.getTime() < now.getTime() - 5 * 60 * 1000) {
      continue;
    }

    const dedupeKey = `events:${event.id}:${event.startTime.toISOString()}`;
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
      const existing = await prisma.scheduledNotification.findUnique({
        where: { dedupeKey },
        select: { id: true, status: true },
      });

      if (!existing) {
        // اولین‌بار: هنوز هیچ رکوردی برای این رویداد ساخته نشده
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
      } else if (existing.status !== 'sent' && existing.status !== 'processing') {
        // یک رکورد قبلی وجود دارد ولی هنوز با موفقیت ارسال نشده (pending / cancelled / expired / failed).
        // چون dedupeKey فقط بر اساس id و startTime رویداد ساخته می‌شود (نه تنظیمات فعلی)، بدون این بازفعال‌سازی
        // هر تلاش قبلیِ ناموفق (مثلاً به‌خاطر ساعت سکوت یا نبود اشتراک پوش در آن لحظه) برای همیشه جلوی
        // ساخت رکورد جدید را می‌گرفت و با هر تغییر تنظیمات (مثل offsetMinutes) دوباره تلاش نمی‌شد.
        await prisma.scheduledNotification.update({
          where: { dedupeKey },
          data: { runAt, payload, status: 'pending', attempts: 0 },
        });
        createdCount++;
      }
      // اگر status === 'sent' یا 'processing' است، دست‌نخورده باقی می‌ماند تا از ارسال تکراری جلوگیری شود
    } catch (err: any) {
      if (err.code !== 'P2002') {
        console.error(`[Event Producer Error]:`, err);
      }
    }
  }

  return createdCount;
}