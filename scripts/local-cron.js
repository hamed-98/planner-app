// scripts/local-cron.js
const CRON_SECRET = 'sayeban_cron_dispatch_secret_key_8f3a9e2c4b1d6f';
const DISPATCH_URL = 'http://localhost:3000/api/cron/dispatcher';

async function triggerCron() {
  try {
    const res = await fetch(DISPATCH_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    const data = await res.json();
    const timeStr = new Date().toLocaleTimeString('fa-IR');

    if (res.ok) {
      const med = data.producedCounts?.medicines ?? 0;
      const ev = data.producedCounts?.events ?? 0;
      if (data.claimedCount > 0) {
        console.log(`[${timeStr}] ⏰ اعلان ارسال شد | تولیدی‌ها: [دارو: ${med} | رویداد: ${ev}] | قفل‌شده: ${data.claimedCount} | موفق: ${data.sentCount}`);
      } else {
        console.log(`[${timeStr}] ℹ️ در انتظار سررسید | تولیدی در این دور: [دارو: ${med} | رویداد: ${ev}]`);
      }
    } else {
      console.warn(`[${timeStr}] ⚠️ خطای کرون:`, data);
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString('fa-IR')}] ❌ ارتباط برقرار نشد:`, err.message);
  }
}

console.log('🚀 شبیه‌ساز لوکال کرون سایبان فعال شد...');
triggerCron();
setInterval(triggerCron, 60 * 1000);