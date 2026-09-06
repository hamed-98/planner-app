// app/api/admin/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';

// اعتبارسنجی سطح دسترسی مدیر کل
async function verifyAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (profile?.role !== 'superadmin') return null;
  return user;
}

// دریافت لیست کاربران و تنظیمات سراسری
export async function GET(req: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز؛ نیازمند نقش مدیر کل' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope');

    if (scope === 'users') {
      const users = await prisma.user.findMany({
        include: {
          profile: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(
        users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.profile?.role || 'user',
          plan: u.profile?.plan || 'free',
          createdAt: u.createdAt.toISOString(),
        }))
      );
    }

    // دریافت تنظیمات سراسری
    const settings = await prisma.globalSetting.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.id] = s.value;
    });

    return NextResponse.json(settingsMap);
  } catch (error: any) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: 'خطا در واکشی اطلاعات مدیریت' }, { status: 500 });
  }
}

// به‌روزرسانی تنظیمات سراسری سیستم (Feature Flags, AI Providers, Announcements)
export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { settingId, value } = body;

    if (!settingId || value === undefined) {
      return NextResponse.json({ error: 'شناسه و مقدار تنظیمات الزامی است' }, { status: 400 });
    }

    const updated = await prisma.globalSetting.upsert({
      where: { id: settingId },
      create: {
        id: settingId,
        value,
      },
      update: {
        value,
      },
    });

    // ثبت لاگ فعالیت ادمین
    await prisma.adminLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: admin.id,
        action: `UPDATE_SETTING_${settingId.toUpperCase()}`,
        details: value,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره تنظیمات' }, { status: 500 });
  }
}

// تغییر نقش یا پلن کاربر توسط مدیر کل
export async function PATCH(req: Request) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { targetUserId, role, plan } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'شناسه کاربر هدف الزامی است' }, { status: 400 });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: targetUserId },
      data: {
        role: role || undefined,
        plan: plan || undefined,
      },
    });

    await prisma.adminLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: admin.id,
        action: 'UPDATE_USER_PERMISSIONS',
        details: { targetUserId, role, plan },
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی دسترسی کاربر' }, { status: 500 });
  }
}