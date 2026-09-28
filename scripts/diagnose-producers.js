// scripts/diagnose-producers.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://sayeban_user:sayeban_password123@localhost:5433/sayeban_db?schema=public',
});

async function run() {
  console.log('🔎 در حال کالبدشکافی پرودیوسرها...\n');

  // ۱. بررسی تطابق UserId در داروها، رویدادها و ساب‌اسکریپشن
  const users = await pool.query('SELECT id, email FROM users');
  console.log('👤 کاربران سیستم:');
  console.table(users.rows);

  const sub = await pool.query('SELECT "userId", endpoint FROM push_subscriptions');
  console.log('📱 کاربری که اشتراک فعال نوتیفیکیشن دارد:', sub.rows);

  const meds = await pool.query('SELECT id, "userId", name, "reminderTimes" FROM medicines ORDER BY "createdAt" DESC LIMIT 2');
  console.log('💊 کاربری که داروی جدید را ثبت کرده:', meds.rows);

  const evs = await pool.query('SELECT id, "userId", title, "startTime" FROM events ORDER BY "createdAt" DESC LIMIT 2');
  console.log('📅 کاربری که رویداد جدید را ثبت کرده:', evs.rows);

  // ۲. بررسی ترجیحات پروفایل کاربر
  const prof = await pool.query('SELECT id, timezone, "notificationPrefs" FROM profiles');
  console.log('⚙️ ترجیحات اعلان پروفایل‌ها:');
  console.table(prof.rows);

  // ۳. بررسی سیاست‌های سراسری در GlobalSetting
  const settings = await pool.query("SELECT id, value FROM global_settings WHERE id = 'notification_policies'");
  console.log('🌐 تنظیمات سراسری نوتیفیکیشن (GlobalSetting):', JSON.stringify(settings.rows[0]?.value || 'پیش‌فرض (خالی)', null, 2));

  await pool.end();
}

run().catch(console.error);