// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    // دریافت پیام‌های یک تیکت مشخص
    if (ticketId) {
      const messages = await prisma.ticketMessage.findMany({
        where: { ticketId },
        include: { sender: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(
        messages.map((m) => ({
          id: m.id,
          ticket_id: m.ticketId,
          sender_id: m.senderId,
          message: m.message,
          is_admin: m.isAdmin,
          created_at: m.createdAt.toISOString(),
          sender_name: m.sender?.name || (m.isAdmin ? 'پشتیبانی' : 'کاربر'),
        }))
      );
    }

    // بررسی دسترسی ادمین
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    const isAdmin = profile?.role === 'superadmin';

    const tickets = await prisma.ticket.findMany({
      where: isAdmin ? {} : { userId: user.id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      tickets.map((t) => ({
        id: t.id,
        user_id: t.userId,
        title: t.title,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        created_at: t.createdAt.toISOString(),
        updated_at: t.updatedAt.toISOString(),
        user_name: t.user?.name || t.user?.email || 'کاربر',
      }))
    );
  } catch (error: any) {
    console.error('Tickets GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت تیکت‌ها' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, title, description, category, priority, ticketId, messageText } = body;

    // ارسال پاسخ جدید در تیکت
    if (action === 'SEND_MESSAGE') {
      if (!ticketId || !messageText) {
        return NextResponse.json({ error: 'متن پاسخ الزامی است' }, { status: 400 });
      }

      const profile = await prisma.profile.findUnique({ where: { id: user.id } });
      const isAdmin = profile?.role === 'superadmin';

      const msg = await prisma.ticketMessage.create({
        data: {
          id: crypto.randomUUID(),
          ticketId,
          senderId: user.id,
          message: messageText.trim(),
          isAdmin,
        },
      });

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json(msg, { status: 201 });
    }

    // ایجاد تیکت جدید
    if (!title || !description) {
      return NextResponse.json({ error: 'عنوان و شرح تیکت الزامی است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    const newTicket = await db.ticket.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        category: category || 'other',
        priority: priority || 'medium',
        status: 'open',
      },
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error('Tickets POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در ثبت تیکت' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ticketId, status, priority } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'شناسه تیکت الزامی است' }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (profile?.role !== 'superadmin') {
      return NextResponse.json({ error: 'تنها مدیران سیستم مجاز به تغییر وضعیت هستند' }, { status: 403 });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: status || undefined,
        priority: priority || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Tickets PATCH error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی تیکت' }, { status: 500 });
  }
}