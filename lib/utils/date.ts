// lib/utils/date.ts
import { format as formatJalali } from 'date-fns-jalali';

export function toPersianDigits(str: string): string {
  return str.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
}

export function getJalaliDate(gregorianDateStr: string, formatStr: string = 'd MMMM yyyy'): string {
  try {
    const d = new Date(gregorianDateStr);
    if (isNaN(d.getTime())) return gregorianDateStr;
    const jalaliFormatted = formatJalali(d, formatStr);
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