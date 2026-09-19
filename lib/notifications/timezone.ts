// lib/notifications/timezone.ts

/**
 * محاسبه دقیق آفست تایمزون (بر حسب دقیقه) با استاندارد بین‌المللی Intl
 */
export function getTimeZoneOffset(date: Date, timeZone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (!tzName || tzName === 'GMT') return 0;
    const match = tzName.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours * 60 + minutes);
  } catch {
    return 0; // در صورت خطا، پیش‌فرض UTC
  }
}

/**
 * تبدیل ساعت و تاریخ محلی کاربر در تایمزون مشخص به شیء UTC استاندارد
 */
export function localTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const approxUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offsetMins = getTimeZoneOffset(approxUtc, timeZone);
  return new Date(approxUtc.getTime() - offsetMins * 60 * 1000);
}

/**
 * دریافت تاریخ روز محلی کاربر به فرمت YYYY-MM-DD
 */
export function getLocalDateString(date: Date = new Date(), timeZone: string = 'Asia/Tehran'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * دریافت ساعت محلی کاربر به فرمت HH:mm
 */
export function getLocalTimeString(date: Date = new Date(), timeZone: string = 'Asia/Tehran'): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const hour = parts.find((p) => p.type === 'hour')?.value || '00';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  } catch {
    return date.toISOString().substring(11, 16);
  }
}
