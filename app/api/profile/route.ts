// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';

// دریافت پروفایل کاربر جاری
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    // در صورت عدم وجود، ایجاد پروفایل پیش‌فرض
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          role: 'user',
          plan: 'free',
          calendarType: 'jalali',
        },
      });
    }

    return NextResponse.json({
      id: profile.id,
      role: profile.role,
      plan: profile.plan,
      avatar_url: profile.avatarUrl,
      theme: profile.theme,
      language: profile.language,
      calendar_type: profile.calendarType,
      calendarType: profile.calendarType,
      heightCm: profile.heightCm || 0,
      created_at: profile.createdAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت پروفایل' }, { status: 500 });
  }
}

// به‌روزرسانی مشخصات و ترجیحات پروفایل
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { calendar_type, calendarType, theme, language, avatar_url, avatarUrl, heightCm } = body;

    const calType = calendarType || calendar_type;
    const avUrl = avatarUrl !== undefined ? avatarUrl : avatar_url;

    const updated = await prisma.profile.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        calendarType: calType || 'jalali',
        theme: theme || 'system',
        language: language || 'fa',
        avatarUrl: avUrl || null,
        heightCm: heightCm !== undefined ? Number(heightCm) : 0,
      },
      update: {
        calendarType: calType || undefined,
        theme: theme || undefined,
        language: language || undefined,
        avatarUrl: avUrl !== undefined ? avUrl : undefined,
        heightCm: heightCm !== undefined ? Number(heightCm) : undefined,
      },
    });

    return NextResponse.json({
      id: updated.id,
      role: updated.role,
      plan: updated.plan,
      avatar_url: updated.avatarUrl,
      theme: updated.theme,
      language: updated.language,
      calendar_type: updated.calendarType,
      calendarType: updated.calendarType,
      heightCm: updated.heightCm ?? 0,
    });
  } catch (error: any) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json({ error: 'خطا در ویرایش پروفایل' }, { status: 500 });
  }
}