// app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت لیست تسک‌ها
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const db = getScopedDb(user.id);
    const tasks = await db.task.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Task GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت اطلاعات' }, { status: 500 });
  }
}

// ایجاد تسک جدید (POST)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, description, priority, status, dueDate, subtasks } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'عنوان تسک الزامی است' }, { status: 400 });
    }

    // رفع باگ UUID: تولید فقط یک‌بار شناسه قطعی
    const targetId = id && typeof id === 'string' && id.trim() ? id.trim() : crypto.randomUUID();

    const db = getScopedDb(user.id);
    const newTask = await db.task.create({
      data: {
        id: targetId,
        userId: user.id,
        title: title.trim(),
        description: description || '',
        priority: (priority || 'medium').toLowerCase(),
        status: status || 'todo',
        dueDate: dueDate || null,
        subtasks: subtasks || [],
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('Task POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ایجاد تسک' }, { status: 500 });
  }
}

// ویرایش جزئی تسک (PATCH)
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, description, priority, status, dueDate, subtasks, expectedUpdatedAt } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'شناسه تسک الزامی است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);

    // ۱. بررسی وجود رکورد و کنترل تعارض نسخه (OCC)
    const existing = await db.task.findUnique({
      where: {
        id_userId: {
          id: id.trim(),
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'تسک مورد نظر یافت نشد' }, { status: 404 });
    }

    // اگر کلاینت زمان آخرین نسخه‌ای که دیده بود را فرستاده و سرور جدیدتر از آن است
    if (expectedUpdatedAt && existing.updatedAt) {
      const clientSeenTime = new Date(expectedUpdatedAt).getTime();
      const serverCurrentTime = new Date(existing.updatedAt).getTime();

      // اختلاف بیش از ۱ ثانیه برای چشم‌پوشی از تأخیرهای ناچیز شبکه
      if (serverCurrentTime - clientSeenTime > 1000) {
        return NextResponse.json(
          {
            error: 'CONFLICT',
            message: 'این تسک روی دستگاه دیگری ویرایش شده است.',
            serverRecord: existing,
          },
          { status: 409 }
        );
      }
    }

    // ۲. ساخت داینامیک فیلدهای نیازمند بروزرسانی بدون اجبار به وجود title
    const updateData: Record<string, any> = {};

    if (title !== undefined) {
      if (typeof title === 'string' && title.trim()) {
        updateData.title = title.trim();
      } else {
        return NextResponse.json({ error: 'عنوان تسک نمی‌تواند خالی باشد' }, { status: 400 });
      }
    }
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = String(priority).toLowerCase();
    if (status !== undefined) updateData.status = status;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;
    if (subtasks !== undefined) updateData.subtasks = subtasks;

    const updatedTask = await db.task.update({
      where: {
        id_userId: {
          id: id.trim(),
          userId: user.id,
        },
      },
      data: updateData,
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'خطای سرور در ویرایش تسک' }, { status: 500 });
  }
}
// حذف تسک (DELETE)
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه تسک ارسال نشده است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.task.delete({
      where: {
        id_userId: {
          id,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Task DELETE error:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'تسک مورد نظر یافت نشد' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'خطا در حذف' }, { status: 500 });
  }
}