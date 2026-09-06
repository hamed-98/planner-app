// app/api/notes/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت تمام یادداشت‌های کاربر
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const notes = await db.note.findMany({
      where: { userId: user.id },
      orderBy: [
        { isPinned: 'desc' },
        { updatedAt: 'desc' }
      ],
    });

    return NextResponse.json(notes);
  } catch (error: any) {
    console.error('Notes GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت یادداشت‌ها' }, { status: 500 });
  }
}

// ایجاد یادداشت جدید (POST)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, content, folder, tags, isPinned } = body;

    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    const db = getScopedDb(user.id);
    const newNote = await db.note.create({
      data: {
        id: targetId,
        userId: user.id,
        title: title || 'یادداشت جدید',
        content: content || '',
        folder: folder || 'شخصی',
        tags: Array.isArray(tags) ? tags : [],
        isPinned: !!isPinned,
      },
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error: any) {
    console.error('Notes POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ایجاد یادداشت' }, { status: 500 });
  }
}

// ویرایش جزئی یادداشت (PATCH)
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, content, folder, tags, isPinned } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'شناسه یادداشت الزامی است' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (folder !== undefined) updateData.folder = folder;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
    if (isPinned !== undefined) updateData.isPinned = Boolean(isPinned);

    const db = getScopedDb(user.id);
    const updatedNote = await db.note.update({
      where: {
        id_userId: {
          id: id.trim(),
          userId: user.id,
        },
      },
      data: updateData,
    });

    return NextResponse.json(updatedNote);
  } catch (error: any) {
    console.error('Notes PATCH error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'یادداشت یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'خطا در ویرایش یادداشت' }, { status: 500 });
  }
}

// حذف یادداشت (DELETE)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه ارسال نشده است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.note.delete({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notes DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'یادداشت یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'خطا در حذف' }, { status: 500 });
  }
}