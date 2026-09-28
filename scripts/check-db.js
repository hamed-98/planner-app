// scripts/check-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://sayeban_user:sayeban_password123@localhost:5433/sayeban_db?schema=public',
});

async function inspect() {
  console.log('🔍 در حال اسکن وضعیت داخلی سیستم اعلان‌ها...\n');

  // ۱. ساعت دیتابیس
  const timeRes = await pool.query("SELECT NOW() as db_utc, CURRENT_SETTING('TIMEZONE') as db_tz");
  console.log('⏰ ساعت فعلی دیتابیس (UTC):', timeRes.rows[0].db_utc);
  console.log('🌍 تایم‌زون فعال دیتابیس:', timeRes.rows[0].db_tz);

  // ۲. وضعیت اشتراک‌های پوش
  const subRes = await pool.query('SELECT count(*) as total, "userId" FROM push_subscriptions GROUP BY "userId"');
  console.log('\n📱 دستگاه‌های متصل (Push Subscriptions):', subRes.rows);

  // ۳. داروهای ثبت شده
  const medRes = await pool.query('SELECT id, name, "reminderTimes", "completedDates" FROM medicines ORDER BY "createdAt" DESC LIMIT 3');
  console.log('\n💊 آخرین داروهای ثبت‌شده:');
  console.table(medRes.rows);

  // ۴. رویدادهای تقویم
  const eventRes = await pool.query('SELECT id, title, "startTime" FROM events ORDER BY "createdAt" DESC LIMIT 3');
  console.log('\n📅 آخرین رویدادهای ثبت‌شده:');
  console.table(eventRes.rows);

  // ۵. ردیف‌های جدول صف اعلان‌ها
  const jobRes = await pool.query('SELECT id, channel, "refId", "runAt", status, "dedupeKey" FROM scheduled_notifications ORDER BY "createdAt" DESC LIMIT 5');
  console.log('\n📬 ردیف‌های صف زمان‌بندی (Scheduled Notifications):');
  console.table(jobRes.rows);

  await pool.end();
}

inspect().catch(err => {
  console.error('❌ خطا در بازرسی:', err.message);
  pool.end();
});