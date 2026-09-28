# 🕒 راهنمای پیکربندی کرون‌جاب سایبان در محیط‌های پروداکشن (Cron Automation Guide)

روت اجرای نوتیفیکیشن‌ها:
`POST https://your-domain.com/api/cron/dispatcher`
هدر الزامی:
`Authorization: Bearer <CRON_SECRET>`

---

## سناریو ۱: سرور اختصاصی لینوکس (VPS / Ubuntu / Debian)
دستور ویرایش کرون‌جاب لینوکس را اجرا کنید:
\`\`\`bash
crontab -e
\`\`\`
خط زیر را برای اجرای هر ۵ دقیقه یک‌بار اضافه کنید:
\`\`\`bash
*/5 * * * * curl -s -X POST https://your-domain.com/api/cron/dispatcher -H "Authorization: Bearer sayeban_cron_dispatch_secret_key_8f3a9e2c4b1d6f" > /dev/null 2>&1
\`\`\`

---

## سناریو ۲: دیپلوی روی Vercel (پلن Pro یا Hobby)
در ریشه پروژه، فایل `vercel.json` بسازید:
\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/dispatcher",
      "schedule": "*/5 * * * *"
    }
  ]
}
\`\`\`
*نکته ورسل:* ورسل هدر `CRON_SECRET` را در هدر `Authorization: Bearer <CRON_SECRET>` خودکار پاس می‌دهد.

---

## سناریو ۳: سرویس‌های رایگان Cron خارجی (مناسب سرورهای رایگان مثل Render / Railway / Cloudflare)
در سایت [cron-job.org](https://cron-job.org):
1. ثبت‌نام کرده و دکمه **Create Cronjob** را بزنید.
2. آدرس: `https://your-domain.com/api/cron/dispatcher`
3. زمان‌بندی: **Every 5 Minutes**
4. متد: **POST**
5. در بخش **Headers**:
   - کلید: `Authorization`
   - مقدار: `Bearer sayeban_cron_dispatch_secret_key_8f3a9e2c4b1d6f`

---

## سناریو ۴: استقرار با Docker Compose
استفاده از کانتینر سبک `mcuadros/ofelia` در فایل `docker-compose.yml`:
\`\`\`yaml
services:
  app:
    # کانتینر اصلی پروژه Next.js
    build: .
    ports:
      - "3000:3000"

  cron:
    image: mcuadros/ofelia:latest
    depends_on:
      - app
    command: daemon --docker
    labels:
      ofelia.job-exec.sayeban-cron.schedule: "@every 5m"
      ofelia.job-exec.sayeban-cron.command: "curl -s -X POST http://app:3000/api/cron/dispatcher -H 'Authorization: Bearer sayeban_cron_dispatch_secret_key_8f3a9e2c4b1d6f'"
\`\`\`