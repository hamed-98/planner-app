// scripts/check-events.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://sayeban_user:sayeban_password123@localhost:5433/sayeban_db?schema=public',
});

async function check() {
  console.log('🔍 بررسی دقیق وضعیت آخرین رویداد ثبت‌شده...\n');

  // ۱. ساعت دیتابیس (UTC و معادل تهران)
  const timeRes = await pool.query("SELECT NOW() as utc_now, NOW() AT TIME ZONE 'Asia/Tehran' as tehran_now");
  console.log('⏰ زمان دیتابیس (UTC):', timeRes.rows[0].utc_now);
  console.log('🇮🇷 زمان معادل تهران:', timeRes.rows[0].tehran_now);

  // ۲. آخرین رویدادهای جدول events
  const events = await pool.query('SELECT id, title, "startTime", "createdAt" FROM events ORDER BY "createdAt" DESC LIMIT 3');
  console.log('\n📅 آخرین رویدادهای ثبت‌شده در events:');
  console.table(events.rows);

  // ۳. ردیف‌های رویداد در صف زمان‌بندی
  const scheduled = await pool.query("SELECT id, \"refId\", \"runAt\", status, \"dedupeKey\", \"createdAt\" FROM scheduled_notifications WHERE channel = 'events' ORDER BY \"createdAt\" DESC LIMIT 5");
  console.log('\n📬 وضعیت صف رویدادها (scheduled_notifications):');
  console.table(scheduled.rows);

  // ۴. وضعیت در جدول تحویل
  const deliveries = await pool.query("SELECT id, channel, status, \"deliveredAt\" FROM notification_deliveries WHERE channel = 'events' ORDER BY \"deliveredAt\" DESC LIMIT 3");
  console.log('\n🚚 وضعیت تحویل رویدادها (notification_deliveries):');
  console.table(deliveries.rows);

  await pool.end();
}

check().catch(err => {
  console.error('❌ خطا:', err.message);
  pool.end();
});