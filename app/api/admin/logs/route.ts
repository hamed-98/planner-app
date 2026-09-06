// app/api/admin/logs/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { id: user.id } });
  if (profile?.role !== 'superadmin') {
    return NextResponse.json({ error: 'دسترسی محدود به مدیر کل است' }, { status: 403 });
  }

  try {
    const logs = await prisma.adminLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        created_at: log.createdAt.toISOString(),
        profiles: {
          name: log.user?.name || '',
          email: log.user?.email || 'سیستم',
        },
      }))
    );
  } catch (error: any) {
    console.error('Admin logs GET error:', error);
    return NextResponse.json({ error: 'خطا در واکشی لاگ‌ها' }, { status: 500 });
  }
}