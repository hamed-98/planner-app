// lib/utils/date.ts
import { format as formatJalali } from 'date-fns-jalali';

export function toPersianDigits(str: string): string {
  return str.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
}

/**
 * پارس ایمن رشته YYYY-MM-DD بدون خطر پرش روز به خاطر افست UTC
 */
export function parseISODateToLocal(isoDateStr: string): Date {
  if (!isoDateStr) return new Date();
  
  // اگر رشته فقط تاریخ است، ساعت ۱۲ ظهر لوکال را به آن نسبت می‌دهیم
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDateStr)) {
    const [year, month, day] = isoDateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  
  const parsed = new Date(isoDateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getJalaliDate(gregorianDateStr: string, formatStr: string = 'd MMMM yyyy'): string {
  try {
    if (!gregorianDateStr) return '';
    const safeDate = parseISODateToLocal(gregorianDateStr);
    const jalaliFormatted = formatJalali(safeDate, formatStr);
    return toPersianDigits(jalaliFormatted);
  } catch {
    return gregorianDateStr;
  }
}

export function getGreetingMessage(): string {
  const hr = new Date().getHours();
  if (hr >= 5 && hr < 12) return 'صبح زیبای شما بخیر';
  if (hr >= 12 && hr < 17) return 'ظهر شما بخیر و شادی';
  if (hr >= 17 && hr < 21) return 'عصر متفکرانه‌ای داشته باشید';
  return 'امیدوارم شب آرامش‌بخشی داشته باشید';
}