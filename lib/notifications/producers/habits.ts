// lib/notifications/producers/habits.ts
import { prisma } from '@/lib/db/prisma';
import { getLocalDateString, localTimeToUtc } from '../timezone';
import { renderTemplate, DEFAULT_NOTIFICATION_POLICIES, NotificationPolicy } from '../template';

/**
 * تولیدکننده صف اعلان‌های هشدار استریک و عادات روزانه
 */
export async function produceHabitNotifications(policies?: NotificationPolicy): Promise<number> {
  const policy = policies || DEFAULT_NOTIFICATION_POLICIES;
  if (!policy.channels.habits.enabled) {
    return 0;
  }

  const triggerHourLocal = policy.channels.habits.triggerHourLocal || '21:00';
  const template = policy.channels.habits.template;
  const now = new Date();
  let createdCount = 0;

  // ۱. واکشی کاربرانی که حداقل یک اشتراک فعال وب‌پوش دارند
  const users = await prisma.user.findMany({
    where: {
      pushSubscriptions: {
        some: {},
      },
    },
    include: {
      profile: true,
      pushSubscriptions: true,
      habits: true,
      neuroHabits: true,
    },
  });

  for (const user of users) {
    if (!user || user.pushSubscriptions.length === 0) continue;

    const prefs = user.profile?.notificationPrefs as Record<string, boolean> | null;
    if (prefs && prefs.habits === false) {
      continue;
    }

    const tz = user.profile?.timezone || 'Asia/Tehran';
    const dateLocal = getLocalDateString(now, tz);
    const runAt = localTimeToUtc(dateLocal, triggerHourLocal, tz);

    // اگر بیش از ۱ ساعت از ساعت مقرر گذشته یا بیش از ۲۴ ساعت در آینده است
    if (runAt.getTime() < now.getTime() - 60 * 60 * 1000) {
      continue;
    }
    if (runAt.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
      continue;
    }

    // بررسی عادات معمولی تکمیل‌نشده در لاگ‌های روز جاری
    const habitIds = user.habits.map((h) => h.id);
    const completedLogs = await prisma.habitLog.findMany({
      where: {
        habitId: { in: habitIds },
        logDate: dateLocal,
        completed: true,
      },
      select: { habitId: true },
    });

    const completedHabitIdSet = new Set(completedLogs.map((l) => l.habitId));
    const pendingRegularHabits = user.habits.filter((h) => !completedHabitIdSet.has(h.id)).length;

    // بررسی عادات نورونی تکمیل‌نشده
    const pendingNeuroHabits = user.neuroHabits.filter((nh) => !nh.completed).length;

    const totalPending = pendingRegularHabits + pendingNeuroHabits;

    // اگر همه عادات تکمیل شده باشد، نیازی به هشدار نیست
    if (totalPending === 0) {
      continue;
    }

    const dedupeKey = `habits:${user.id}:${dateLocal}`;
    const renderedBody = renderTemplate(template, {
      pendingCount: String(totalPending),
    });

    const payload = {
      title: 'حفظ استریک و عادات روزانه 🔥',
      body: renderedBody,
      icon: '/icons/icon-192.png',
      url: '/dashboard?tab=overview',
      payload: {
        channel: 'habits',
        refId: user.id,
        dedupeKey,
        url: '/dashboard?tab=overview',
      },
    };

    try {
      await prisma.scheduledNotification.create({
        data: {
          userId: user.id,
          channel: 'habits',
          refId: user.id,
          dedupeKey,
          payload,
          runAt,
          status: 'pending',
        },
      });
      createdCount++;
    } catch (err: any) {
      if (err.code !== 'P2002') {
        console.error(`[Habits Producer] Error scheduling for user ${user.id}:`, err);
      }
    }
  }

  return createdCount;
}
