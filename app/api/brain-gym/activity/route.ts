// app/api/brain-gym/activity/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت و تجمیع شاخص‌های شناختی (Rolling Window 20 Events)
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const clientToday = searchParams.get('today') || new Date().toISOString().split('T')[0];

    const db = getScopedDb(user.id);
    const logs = await db.brainActivityLog.findMany({
      where: { userId: user.id },
      orderBy: { playedAt: 'desc' },
      take: 100,
    });

    const processGameType = (gType: 'spatial_memory' | 'stroop_test' | 'math_speed') => {
      const allGameLogs = logs.filter((l) => l.gameType === gType);
      const validLogs = allGameLogs.filter(
        (l) => l.normalizedScore !== null && !((l.rawMetrics as any)?.status || '').includes('invalid')
      );

      const recent20Valid = validLogs.slice(0, 20);
      const sampleSize = recent20Valid.length;

      const todayValidLogs = validLogs.filter(
        (l) => l.playedAt.toISOString().split('T')[0] === clientToday
      );
      const todayAttempts = todayValidLogs.length;
      const todayScore =
        todayAttempts > 0
          ? Math.round(
              todayValidLogs.reduce((acc, curr) => acc + Number(curr.normalizedScore), 0) / todayAttempts
            )
          : null;

      if (sampleSize < 3) {
        return {
          score: null,
          isCalibrating: true,
          sampleSize,
          todayScore,
          todayAttempts,
          lastPlayedAt: validLogs[0]?.playedAt.toISOString() || null,
        };
      }

      const rollingAvg = Math.round(
        recent20Valid.reduce((acc, curr) => acc + Number(curr.normalizedScore), 0) / sampleSize
      );

      return {
        score: rollingAvg,
        isCalibrating: false,
        sampleSize,
        todayScore,
        todayAttempts,
        lastPlayedAt: validLogs[0]?.playedAt.toISOString() || null,
      };
    };

    const spatial = processGameType('spatial_memory');
    const stroop = processGameType('stroop_test');
    const math = processGameType('math_speed');

    const validRecentLogs = logs
      .filter((l) => l.normalizedScore !== null && !((l.rawMetrics as any)?.status || '').includes('invalid'))
      .slice(0, 20);

    const reactions: number[] = [];
    validRecentLogs.forEach((l) => {
      const rm = l.rawMetrics as any;
      if (rm?.avg_reaction_ms) reactions.push(Number(rm.avg_reaction_ms));
      if (rm?.avg_incongruent_ms) reactions.push(Number(rm.avg_incongruent_ms));
    });

    const avgReactionTimeMs =
      reactions.length > 0
        ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
        : null;

    const validScores = [spatial.score, stroop.score, math.score].filter((s): s is number => s !== null);
    const accuracyRate =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : null;
    const overallIndex =
      validScores.length > 0
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : null;

    return NextResponse.json({
      spatialMemory: spatial,
      stroopFlexibility: stroop,
      mathSpeed: math,
      avgReactionTimeMs,
      accuracyRate,
      overallIndex,
      totalGamesAllTime: logs.length,
    });
  } catch (error: any) {
    console.error('BrainActivity GET error:', error);
    return NextResponse.json({ error: 'خطا در محاسبه شاخص‌های شناختی' }, { status: 500 });
  }
}

// ثبت لاگ بازی جدید
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { gameType, rawMetrics, normalizedScore } = body;

    if (!gameType) {
      return NextResponse.json({ error: 'نوع بازی الزامی است' }, { status: 400 });
    }

    const cleanScore =
      normalizedScore !== null && normalizedScore !== undefined
        ? Math.max(0, Math.min(100, Math.round(Number(normalizedScore))))
        : null;

    const db = getScopedDb(user.id);
    const log = await db.brainActivityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        gameType,
        rawMetrics: rawMetrics || {},
        normalizedScore: cleanScore,
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error: any) {
    console.error('BrainActivity POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ثبت لاگ بازی' }, { status: 500 });
  }
}