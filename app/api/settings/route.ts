// app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه تنظیمات ارسال نشده است' }, { status: 400 });
    }

    const setting = await prisma.globalSetting.findUnique({
      where: { id },
    });

    return NextResponse.json(setting?.value || null);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(null);
  }
}