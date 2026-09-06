// app/api/assistant/usage/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ count: 0, limit: 15, plan: 'free' });
  }

  try {
    const now = new Date();
    const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // اصلاح بخش featureFlags در app/api/assistant/usage/route.ts
    let freeLimit = 15;
    try {
    const featureFlags = await prisma.globalSetting.findUnique({
        where: { id: "feature_flags" },
    });
    if (featureFlags?.value && typeof featureFlags.value === "object") {
        const flags = featureFlags.value as Record<string, any>;
        if (flags.free_tier_daily_limit) {
        freeLimit = Number(flags.free_tier_daily_limit);
        }
    }
    } catch {}

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    const plan = profile?.plan || 'free';
    const limit = plan === 'pro' ? 100 : plan === 'team' ? 250 : freeLimit;

    const usage = await prisma.userAiUsage.findUnique({
      where: {
        userId_usageDate: {
          userId: user.id,
          usageDate: localTodayStr,
        },
      },
    });

    return NextResponse.json({
      count: usage?.requestCount || 0,
      limit,
      plan,
    });
  } catch (err) {
    console.error('AI Usage GET error:', err);
    return NextResponse.json({ count: 0, limit: 15, plan: 'free' });
  }
}