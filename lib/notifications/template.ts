// lib/notifications/template.ts
import { getLocalTimeString } from '@/lib/utils/timezone';

export interface NotificationPolicy {
  channels: {
    medicines: {
      enabled: boolean;
      quietHoursMode: 'silent' | 'drop';
      template: string;
    };
    events: {
      enabled: boolean;
      offsetMinutes: number;
      quietHoursMode: 'silent' | 'drop';
      template: string;
    };
    habits: {
      enabled: boolean;
      triggerHourLocal: string;
      quietHoursMode: 'silent' | 'drop';
      template: string;
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // e.g. "23:30"
    end: string;   // e.g. "07:30"
  };
}

export const DEFAULT_NOTIFICATION_POLICIES: NotificationPolicy = {
  channels: {
    medicines: {
      enabled: true,
      quietHoursMode: 'silent',
      template: 'زمان مصرف داروی {name} {dosage} فرا رسید.',
    },
    events: {
      enabled: true,
      offsetMinutes: 15,
      quietHoursMode: 'drop',
      template: 'یادآوری: رویداد «{title}» تا {offset} دقیقه دیگر آغاز می‌شود.',
    },
    habits: {
      enabled: true,
      triggerHourLocal: '21:00',
      quietHoursMode: 'drop',
      template: 'استریک خود را حفظ کنید؛ {pendingCount} ماموریت تکمیل‌نشده باقی مانده است.',
    },
  },
  quietHours: {
    enabled: true,
    start: '23:30',
    end: '07:30',
  },
};

/**
 * رندر قالب اعلان با جایگزینی امن متغیرها
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let out = template;
  for (const [k, v] of Object.entries(data)) {
    const val = v !== null && v !== undefined ? String(v) : '';
    out = out.replaceAll(`{${k}}`, val);
  }
  // پاکسازی پرانتزهای خالی باقی‌مانده و فاصله‌های اضافه
  return out.replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * اعتبارسنجی استاندارد IANA برای رشته تایمزون
 */
export function isValidTimeZone(tz: string): boolean {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * بررسی اینکه آیا ساعت مشخصی در تایمزون محلی درون بازه ساعات سکوت است یا خیر
 * محاسبه ساعت محلی از سرویس مشترک lib/utils/timezone گرفته می‌شود تا منطق تبدیل زمان
 * فقط در یک جا (نه اینجا و نه هر پرودیوسر جدا) نوشته شده باشد.
 */
export function isWithinQuietHours(
  localDate: Date,
  timeZone: string,
  startStr: string, // "23:30"
  endStr: string    // "07:30"
): boolean {
  try {
    const [hourStr, minuteStr] = getLocalTimeString(localDate, timeZone).split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const currentMins = hour * 60 + minute;

    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins <= endMins) {
      // بازه در یک روز (مثلا 01:00 تا 06:00)
      return currentMins >= startMins && currentMins < endMins;
    } else {
      // بازه با عبور از نیمه‌شب (مثلا 23:30 تا 07:30)
      return currentMins >= startMins || currentMins < endMins;
    }
  } catch {
    return false;
  }
}