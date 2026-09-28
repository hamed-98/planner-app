// scripts/debug-push.js
const { Pool } = require('pg');
const webpush = require('web-push');

const pool = new Pool({
  connectionString: 'postgresql://sayeban_user:sayeban_password123@localhost:5433/sayeban_db?schema=public',
});

// کلیدهای VAPID از .env.local
const publicKey = 'BLqja3Lw_rNxM6q71xtMLSX1M63XyBLYx59fGGfquoJZyTK12Mo8fGQLEQMx5Dj3rupJndLAiVN7FtXUpuBQt_s';
const privateKey = 'bsVp6HB52kr3DeUBuTr6AalxVSyyDcKNpN7SrLUmWb0';
webpush.setVapidDetails('mailto:support@sayeban.app', publicKey, privateKey);

async function debug() {
  console.log('🔍 بررسی علت عدم ارسال نهایی...\n');

  // ۱. بررسی جدول لاگ‌های تحویل (Notification Deliveries)
  const deliveries = await pool.query('SELECT channel, status, "scheduledFor", "deliveredAt" FROM notification_deliveries ORDER BY "deliveredAt" DESC LIMIT 3');
  console.log('📋 آخرین وضعیت‌های ثبت‌شده در جدول تحویل:');
  console.table(deliveries.rows);

  // ۲. استخراج اشتراک کاربر جاری
  const subRes = await pool.query("SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE \"userId\" = '2ofliaxUeYfGEuhgyhQxM8WhkzQqYc17'");
  if (subRes.rows.length === 0) {
    console.log('❌ هیچ اشتراکی برای این کاربر یافت نشد!');
    await pool.end();
    return;
  }

  const sub = subRes.rows[0];
  console.log('📱 در حال تست شلیک مستقیم به اشتراک کاربر جاری...');

  try {
    const payload = JSON.stringify({
      title: 'تست مستقیم به کاربر جاری',
      body: 'اگر این پیام ظاهر شد، اتصال وب‌پوش ۱۰۰٪ برقرار است.',
      icon: '/icons/icon-192.png',
      payload: { dedupeKey: `direct-${Date.now()}` }
    });

    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      },
      payload
    );
    console.log('✅ شلیک موفقیت‌آمیز بود! پیام به مرورگر تحویل داده شد.');
  } catch (err) {
    console.error('❌ خطای دقیق ارسال وب‌پوش:');
    console.error('Status Code:', err.statusCode);
    console.error('Body:', err.body);
    console.error('Message:', err.message);
  }

  await pool.end();
}

debug();