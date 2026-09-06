// app/api/admin/stats/route.ts
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
    const [totalUsers, totalTasks, totalNotes] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.note.count(),
    ]);

    // محاسبه کاربران ثبت‌نامی در ۷ روز اخیر
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: lastWeek } },
      select: { createdAt: true },
    });

    const days = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
    const signupsMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      signupsMap[days[d.getDay()]] = 0;
    }

    recentUsers.forEach((u) => {
      const dayName = days[new Date(u.createdAt).getDay()];
      if (signupsMap[dayName] !== undefined) {
        signupsMap[dayName]++;
      }
    });

    const signupsData = Object.keys(signupsMap).map((day) => ({
      name: day,
      users: signupsMap[day],
    }));

    // واکشی ۵ لاگ سیستمی اخیر
    const recentLogs = await prisma.adminLog.findMany({
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers: recentUsers.length,
        totalTasks,
        totalNotes,
      },
      signupsData,
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        action: log.action,
        details: log.details,
        created_at: log.createdAt.toISOString(),
        user_name: log.user?.name || log.user?.email || 'سیستم',
      })),
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'خطا در واکشی آمار' }, { status: 500 });
  }
}