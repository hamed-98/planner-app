// app/api/brain-gym/profile/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    let profile = await db.brainProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await db.brainProfile.create({
        data: { userId: user.id },
      });
    }

    return NextResponse.json({
      memoryScore: profile.memoryScore,
      flexibilityScore: profile.flexibilityScore,
      processingSpeed: profile.processingSpeed,
      focusEnergy: profile.focusEnergy,
      gamesPlayed: profile.gamesPlayed,
      totalAccuracies: Array.isArray(profile.totalAccuracies) ? profile.totalAccuracies : [],
      reactionTimes: Array.isArray(profile.reactionTimes) ? profile.reactionTimes : [],
      streakDays: profile.streakDays,
      lastPlayedDate: profile.lastPlayedDate || '',
      unlockedBadges: Array.isArray(profile.unlockedBadges) ? profile.unlockedBadges : [],
    });
  } catch (error: any) {
    console.error('BrainProfile GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت پروفایل مغز' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const db = getScopedDb(user.id);

    const updated = await db.brainProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        memoryScore: Number(body.memoryScore || 0),
        flexibilityScore: Number(body.flexibilityScore || 0),
        processingSpeed: Number(body.processingSpeed || 0),
        focusEnergy: Number(body.focusEnergy || 0),
        gamesPlayed: Number(body.gamesPlayed || 0),
        totalAccuracies: body.totalAccuracies || [],
        reactionTimes: body.reactionTimes || [],
        streakDays: Number(body.streakDays || 0),
        lastPlayedDate: body.lastPlayedDate || new Date().toISOString().split('T')[0],
        unlockedBadges: body.unlockedBadges || [],
      },
      update: {
        memoryScore: body.memoryScore !== undefined ? Number(body.memoryScore) : undefined,
        flexibilityScore: body.flexibilityScore !== undefined ? Number(body.flexibilityScore) : undefined,
        processingSpeed: body.processingSpeed !== undefined ? Number(body.processingSpeed) : undefined,
        focusEnergy: body.focusEnergy !== undefined ? Number(body.focusEnergy) : undefined,
        gamesPlayed: body.gamesPlayed !== undefined ? Number(body.gamesPlayed) : undefined,
        totalAccuracies: body.totalAccuracies !== undefined ? body.totalAccuracies : undefined,
        reactionTimes: body.reactionTimes !== undefined ? body.reactionTimes : undefined,
        streakDays: body.streakDays !== undefined ? Number(body.streakDays) : undefined,
        lastPlayedDate: body.lastPlayedDate !== undefined ? body.lastPlayedDate : undefined,
        unlockedBadges: body.unlockedBadges !== undefined ? body.unlockedBadges : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('BrainProfile POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ذخیره پروفایل مغز' }, { status: 500 });
  }
}