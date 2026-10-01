// lib/notifications/producers/medicines.ts
import { prisma } from '@/lib/db/prisma';
import { getLocalDateString, localTimeToUtc } from '@/lib/utils/timezone';
import { renderTemplate, DEFAULT_NOTIFICATION_POLICIES, NotificationPolicy } from '../template';

/**
 * تولیدکننده صف اعلان‌های داروها
 * این متد قبل از اجرای دیسپچر فراخوانی می‌شود تا زمان‌بندی‌های داروها را در صف ScheduledNotification درج کند.
 */
export async function produceMedicineNotifications(policies?: NotificationPolicy): Promise<number> {
  const policy = policies || DEFAULT_NOTIFICATION_POLICIES;
  if (!policy.channels.medicines.enabled) {
    return 0;
  }

  const template = policy.channels.medicines.template;
  const now = new Date();
  let createdCount = 0;

  // ۱. واکشی داروهای کاربرانی که حداقل یک اشتراک فعال وب‌پوش دارند
  const medicines = await prisma.medicine.findMany({
    where: {
      user: {
        pushSubscriptions: {
          some: {}, // محافظ No-Subscription: فقط کاربرانی که اشتراک دارند
        },
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

  for (const med of medicines) {
    const user = med.user;
    if (!user || user.pushSubscriptions.length === 0) continue;

    // بررسی ترجیحات شخصی کاربر (notificationPrefs)
    const prefs = user.profile?.notificationPrefs as Record<string, boolean> | null;
    if (prefs && prefs.medicines === false) {
      continue;
    }

    const tz = user.profile?.timezone || 'Asia/Tehran';
    const dateLocal = getLocalDateString(now, tz);

    // اگر دارو امروز قبلاً مصرف شده است، آلارم داده نشود
    if (med.completedDates && med.completedDates.includes(dateLocal)) {
      continue;
    }

    const reminderTimes = med.reminderTimes || [];
    for (const timeStr of reminderTimes) {
      if (!timeStr || !timeStr.includes(':')) continue;

      // تبدیل ساعت و تاریخ محلی به UTC
      const runAt = localTimeToUtc(dateLocal, timeStr.trim(), tz);

      // محافظ کهنگی پیش از ثبت: اگر زمان اعلان بیش از ۳۰ دقیقه گذشته، ثبت نشود
      if (runAt.getTime() < now.getTime() - 30 * 60 * 1000) {
        continue;
      }

      // اگر زمان بیش از ۲۴ ساعت در آینده است، در دور بعدی کرون ثبت شود
      if (runAt.getTime() > now.getTime() + 24 * 60 * 60 * 1000) {
        continue;
      }

      const dedupeKey = `medicines:${med.id}:${dateLocal}_${timeStr.trim()}`;
      const renderedBody = renderTemplate(template, {
        name: med.name,
        dosage: med.dosage || '',
        time: timeStr.trim(),
      });

      const payload = {
        title: "یادآوری مصرف دارو 💊",
        body: renderedBody,
        icon: "/icons/icon-192.png",
        url: `/dashboard?action=med_done&id=${med.id}`,
        actions: [
          { action: "MARK_DONE", title: "مصرف کردم ✅" },
          { action: "SNOOZE_10", title: "۱۰ دقیقه بعد ⏳" },
        ],
        payload: {
          channel: "medicines",
          refId: med.id,
          dedupeKey,
          url: `/dashboard?action=med_done&id=${med.id}`,
        },
      };

      const existing = await prisma.scheduledNotification.findUnique({
        where: { dedupeKey },
        select: { id: true },
      });

      if (!existing) {
        try {
          await prisma.scheduledNotification.create({
            data: {
              userId: user.id,
              channel: "medicines",
              refId: med.id,
              dedupeKey,
              payload,
              runAt,
              status: "pending",
            },
          });
          createdCount++;
        } catch (err: any) {
          if (err.code !== "P2002") {
            console.error(
              `[Medicine Producer] Error scheduling for med ${med.id}:`,
              err,
            );
          }
        }
      }
    }
  }

  return createdCount;
}