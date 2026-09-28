// app/api/cron/dispatcher/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { webpush } from '@/lib/notifications/server';
import {
  DEFAULT_NOTIFICATION_POLICIES,
  NotificationPolicy,
  isWithinQuietHours,
} from '@/lib/notifications/template';
import { produceMedicineNotifications } from '@/lib/notifications/producers/medicines';
import { produceEventNotifications } from '@/lib/notifications/producers/events';
import { produceHabitNotifications } from '@/lib/notifications/producers/habits';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return handleDispatch(req);
}

export async function POST(req: Request) {
  return handleDispatch(req);
}

async function handleDispatch(req: Request) {
  // ۱. گارد امنیتی بررسی توکن کرون‌سکرت
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'عدم دسترسی معتبر برای کرون‌جاب' }, { status: 401 });
  }

  try {
    // ۲. بارگذاری خط‌مشی‌های سراسری سیستم از GlobalSetting یا پیش‌فرض‌ها
    let policy: NotificationPolicy = DEFAULT_NOTIFICATION_POLICIES;
    try {
      const setting = await prisma.globalSetting.findUnique({
        where: { id: 'notification_policies' },
      });
      if (setting && setting.value) {
        policy = setting.value as unknown as NotificationPolicy;
      }
    } catch (e) {
      console.warn('[Dispatcher] Using default notification policy:', e);
    }

    // ۳. فراخوانی تولیدکننده‌ها (Producers)
    const [producedMedicines, producedEvents, producedHabits] = await Promise.all([
      produceMedicineNotifications(policy).catch((e) => { console.error('Medicine Producer error:', e); return 0; }),
      produceEventNotifications(policy).catch((e) => { console.error('Event Producer error:', e); return 0; }),
      produceHabitNotifications(policy).catch((e) => { console.error('Habit Producer error:', e); return 0; }),
    ]);

    // ۴. قفل و رزرو اتمیک ردیف‌های آماده ارسال با کوئری خام Postgres (SKIP LOCKED)
    const claimedRows: any[] = await prisma.$queryRaw`
      WITH next_jobs AS (
        SELECT id
        FROM "scheduled_notifications"
        WHERE status = 'pending' AND "runAt" <= NOW()
        ORDER BY "runAt" ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "scheduled_notifications"
      SET status = 'processing'
      WHERE id IN (SELECT id FROM next_jobs)
      RETURNING *;
    `;

    if (!claimedRows || claimedRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'هیچ اعلانی در صف اجرا وجود ندارد.',
        producedCounts: {
          medicines: producedMedicines,
          events: producedEvents,
          habits: producedHabits,
        },
        claimedCount: 0,
        sentCount: 0,
      });
    }

    const stalenessLimits: Record<string, number> = {
      medicines: 30 * 60 * 1000, // ۳۰ دقیقه
      events: 5 * 60 * 1000,     // ۵ دقیقه
      habits: 60 * 60 * 1000,    // ۶۰ دقیقه
    };

    let sentCount = 0;
    let expiredCount = 0;
    let droppedCount = 0;

    // ۵. حلقه پردازش اعلان‌های رزرو شده
    for (const item of claimedRows) {
      const nowMs = Date.now();
      const runAtMs = new Date(item.runAt).getTime();
      const limitMs = stalenessLimits[item.channel] || 30 * 60 * 1000;

      // الف) محافظ کهنگی (Staleness Guard)
      if (nowMs - runAtMs > limitMs) {
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: { status: 'expired' },
        });
        await prisma.notificationDelivery.create({
          data: {
            userId: item.userId,
            channel: item.channel,
            refId: item.refId,
            scheduledFor: item.runAt,
            status: 'expired',
          },
        }).catch(() => {});
        expiredCount++;
        continue;
      }

      // ب) بررسی فعال بودن کانال در تنظیمات سیستم
      const channelConfig = policy.channels[item.channel as keyof typeof policy.channels];
      if (channelConfig && !channelConfig.enabled) {
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: { status: 'cancelled' },
        });
        continue;
      }

      // ج) استعلام پروفایل کاربر و ساعات سکوت
      const profile = await prisma.profile.findUnique({ where: { id: item.userId } });
      const userTz = profile?.timezone || 'Asia/Tehran';

      // بررسی ترجیحات شخصی کاربر
      const userPrefs = profile?.notificationPrefs as Record<string, boolean> | null;
      if (userPrefs && userPrefs[item.channel] === false) {
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: { status: 'cancelled' },
        });
        continue;
      }

      // د) ارزیابی ساعات سکوت محلی (Quiet Hours)
      let isSilent = false;
      if (policy.quietHours.enabled) {
        const inQuiet = isWithinQuietHours(
          new Date(),
          userTz,
          policy.quietHours.start,
          policy.quietHours.end
        );

        if (inQuiet) {
          const mode = channelConfig?.quietHoursMode || 'silent';
          if (mode === 'drop') {
            await prisma.scheduledNotification.update({
              where: { id: item.id },
              data: { status: 'cancelled' },
            });
            await prisma.notificationDelivery.create({
              data: {
                userId: item.userId,
                channel: item.channel,
                refId: item.refId,
                scheduledFor: item.runAt,
                status: 'dropped_quiet_hours',
              },
            }).catch(() => {});
            droppedCount++;
            continue;
          } else {
            // حالت silent
            isSilent = true;
          }
        }
      }

      // هـ) رزرو خوش‌بینانه Idempotency جهت جلوگیری قطعی از ارسال موازی
      try {
        await prisma.notificationDelivery.create({
          data: {
            userId: item.userId,
            channel: item.channel,
            refId: item.refId,
            scheduledFor: item.runAt,
            status: 'delivered',
          },
        });
      } catch (err: any) {
        if (err.code === 'P2002') {
          // این اعلان قبلاً تحویل شده؛ رکورد صف لغو می‌شود
          await prisma.scheduledNotification.update({
            where: { id: item.id },
            data: { status: 'cancelled' },
          });
          continue;
        }
        throw err;
      }

      // و) واکشی دستگاه‌های فعال کاربر (Multi-Device Fan-Out)
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId: item.userId },
      });

      if (subscriptions.length === 0) {
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: { status: 'failed', attempts: { increment: 1 } },
        });
        await prisma.notificationDelivery.update({
          where: {
            userId_channel_refId_scheduledFor: {
              userId: item.userId,
              channel: item.channel,
              refId: item.refId,
              scheduledFor: item.runAt,
            },
          },
          data: { status: 'failed' },
        }).catch(() => {});
        continue;
      }

      // ز) شلیک وب‌پوش به تمام دستگاه‌های کاربر
      const payloadObj = typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload;
      const pushString = JSON.stringify({
        ...payloadObj,
        silent: isSilent,
      });

      let anySuccess = false;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushString
          );
          anySuccess = true;
        } catch (err: any) {
          console.error(`[Push] Error sending to ${sub.endpoint}:`, err.statusCode || err);
          if (err.statusCode === 404 || err.statusCode === 410) {
            // پاکسازی خودکار اندپوینت‌های نامعتبر یا منقضی‌شده
            await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {});
          }
        }
      }

      if (anySuccess) {
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: { status: 'sent' },
        });
        sentCount++;
      } else {
        await prisma.scheduledNotification.update({
          where: { id: item.id },
          data: { status: 'failed', attempts: { increment: 1 } },
        });
        await prisma.notificationDelivery.update({
          where: {
            userId_channel_refId_scheduledFor: {
              userId: item.userId,
              channel: item.channel,
              refId: item.refId,
              scheduledFor: item.runAt,
            },
          },
          data: { status: 'failed' },
        }).catch(() => {});
      }
    }

    // ۶. پاکسازی دوره‌ای دیتابیس (Data Retention Policy)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    await prisma.scheduledNotification.deleteMany({
      where: {
        status: { in: ['sent', 'expired', 'cancelled'] },
        createdAt: { lt: sevenDaysAgo },
      },
    }).catch(() => {});

    await prisma.notificationDelivery.deleteMany({
      where: {
        deliveredAt: { lt: sixtyDaysAgo },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      producedCounts: {
        medicines: producedMedicines,
        events: producedEvents,
        habits: producedHabits,
      },
      claimedCount: claimedRows.length,
      sentCount,
      expiredCount,
      droppedCount,
    });
  } catch (error: any) {
    console.error('Dispatcher error:', error);
    return NextResponse.json({ error: 'خطا در اجرای دیسپچر اعلان‌ها', details: error.message }, { status: 500 });
  }
}
