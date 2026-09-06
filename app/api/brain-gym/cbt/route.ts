// app/api/brain-gym/cbt/route.ts
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
    const records = await db.cbtRecord.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = records.map((r) => ({
      id: r.id,
      situation: r.situation,
      automaticThought: r.automaticThought,
      initialBelief: r.initialBelief,
      emotion: r.emotion,
      emotionIntensity: r.emotionIntensity,
      distortion: r.distortion,
      evidenceFor: r.evidenceFor || '',
      evidenceAgainst: r.evidenceAgainst || '',
      reframedThought: r.reframedThought,
      newBelief: r.newBelief,
      date: new Date(r.createdAt).toLocaleDateString('fa-IR'),
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error('CbtRecord GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت پرونده‌های CBT' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      situation,
      automaticThought,
      initialBelief,
      emotion,
      emotionIntensity,
      distortion,
      evidenceFor,
      evidenceAgainst,
      reframedThought,
      newBelief,
    } = body;

    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    const db = getScopedDb(user.id);
    const newRecord = await db.cbtRecord.create({
      data: {
        id: targetId,
        userId: user.id,
        situation: situation || '',
        automaticThought: automaticThought || '',
        initialBelief: Number(initialBelief ?? 50),
        emotion: emotion || '',
        emotionIntensity: Number(emotionIntensity ?? 50),
        distortion: distortion || '',
        evidenceFor: evidenceFor || '',
        evidenceAgainst: evidenceAgainst || '',
        reframedThought: reframedThought || '',
        newBelief: Number(newBelief ?? 50),
      },
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error: any) {
    console.error('CbtRecord POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ثبت رکورد CBT' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه رکورد الزامی است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.cbtRecord.delete({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('CbtRecord DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف رکورد' }, { status: 500 });
  }
}