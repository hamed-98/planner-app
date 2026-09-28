// scripts/test-event-debug.js
const { Pool } = require('pg');
const webpush = require('web-push');

const pool = new Pool({
  connectionString: 'postgresql://sayeban_user:sayeban_password123@localhost:5433/sayeban_db?schema=public',
});

const publicKey = 'BLqja3Lw_rNxM6q71xtMLSX1M63XyBLYx59fGGfquoJZyTK12Mo8fGQLEQMx5Dj3rupJndLAiVN7FtXUpuBQt_s';
const privateKey = 'bsVp6HB52kr3DeUBuTr6AalxVSyyDcKNpN7SrLUmWb0';
webpush.setVapidDetails('mailto:support@sayeban.app', publicKey, privateKey);

async function inspectAndFire() {
  console.log('🔬 در حال کالبدشکافی کامل سیستم رویدادها...\n');

  // ۱. وضعیت زمان دیتابیس
  const timeRes = await pool.query("SELECT NOW() as db_now, CURRENT_SETTING('TIMEZONE') as db_tz");
  console.log('⏰ زمان UTC فعلی دیتابیس:', timeRes.rows[0].db_now);

  // ۲. استخراج آخرین رویداد ثبت‌شده
  const eventRes = await pool.query('SELECT id, "userId", title, "startTime", "createdAt" FROM events ORDER BY "createdAt" DESC LIMIT 1');
  if (eventRes.rows.length === 0) {
    console.log('❌ هیچ رویدادی در دیتابیس یافت نشد!');
    await pool.end();
    return;
  }
  const lastEvent = eventRes.rows[0];
  console.log('📅 آخرین رویداد ثبت‌شده:', lastEvent);

  // ۳. بررسی وضعیت این رویداد در صف
  const jobRes = await pool.query('SELECT id, "refId", "runAt", status, "dedupeKey", ("runAt" <= NOW()) as is_due FROM scheduled_notifications WHERE "refId" = $1', [lastEvent.id]);
  console.log('\n📬 وضعیت این رویداد در جدول صف (scheduled_notifications):');
  console.table(jobRes.rows);

  // ۴. بررسی وضعیت تحویل
  const deliveryRes = await pool.query('SELECT channel, status, "scheduledFor", "deliveredAt" FROM notification_deliveries WHERE "refId" = $1', [lastEvent.id]);
  console.log('\n🚚 وضعیت در جدول تحویل (notification_deliveries):');
  console.table(deliveryRes.rows);

  // ۵. اگر ردیف سررسید شده ولی گیر کرده، ارسال فوری و زنده انجام شود
  const subRes = await pool.query('SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE "userId" = $1', [lastEvent.userId]);
  if (subRes.rows.length > 0 && jobRes.rows.length > 0) {
    console.log('\n🚀 در حال شلیک مستقیم تست اعلان رویداد به مرورگر...');
    try {
      const payload = JSON.stringify({
        title: 'یادآوری رویداد تقویم 📅',
        body: `تست زنده: رویداد «${lastEvent.title}»`,
        icon: '/icons/icon-192.png',
        url: '/dashboard?tab=calendar',
      });

      await webpush.sendNotification(
        {
          endpoint: subRes.rows[0].endpoint,
          keys: { p256dh: subRes.rows[0].p256dh, auth: subRes.rows[0].auth },
        },
        payload
      );
      console.log('✅ اعلان با موفقیت روی مانیتور ارسال شد!');
    } catch (err) {
      console.error('❌ خطا در ارسال وب‌پوش:', err.message);
    }
  }

  await pool.end();
}

inspectAndFire();