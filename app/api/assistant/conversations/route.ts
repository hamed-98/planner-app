// app/api/assistant/conversations/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { getScopedDb } from '@/lib/db/scoped';

// دریافت گفتگوها یا پیام‌های یک گفتگوی خاص
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const db = getScopedDb(user.id);

    if (conversationId) {
      const messages = await db.aiMessage.findMany({
        where: {
          conversationId,
          conversation: { userId: user.id },
        },
        orderBy: { createdAt: 'asc' },
        take: 30,
      });

      return NextResponse.json(
        messages.map((m) => ({
          id: m.id,
          conversation_id: m.conversationId,
          sender: m.sender,
          content: m.content,
          action_payload: m.actionPayload,
          created_at: m.createdAt.toISOString(),
        }))
      );
    }

    const conversations = await db.aiConversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      conversations.map((c) => ({
        id: c.id,
        title: c.title,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      }))
    );
  } catch (error: any) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت گفتگوها' }, { status: 500 });
  }
}

// ساخت گفتگوی جدید یا ثبت پیام
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, title, conversationId, sender, content, actionPayload } = body;
    const db = getScopedDb(user.id);

    if (action === 'CREATE_CONVERSATION') {
      const conv = await db.aiConversation.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          title: title || 'گفتگوی جدید',
        },
      });

      return NextResponse.json({
        id: conv.id,
        title: conv.title,
        created_at: conv.createdAt.toISOString(),
        updated_at: conv.updatedAt.toISOString(),
      }, { status: 201 });
    }

    if (action === 'SAVE_MESSAGE') {
      if (!conversationId || !content) {
        return NextResponse.json({ error: 'اطلاعات پیام ناقص است' }, { status: 400 });
      }

      const msg = await db.aiMessage.create({
        data: {
          id: crypto.randomUUID(),
          conversationId,
          sender: sender || 'user',
          content,
          actionPayload: actionPayload || null,
        },
      });

      await db.aiConversation.update({
        where: { id_userId: { id: conversationId, userId: user.id } },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        id: msg.id,
        conversation_id: msg.conversationId,
        sender: msg.sender,
        content: msg.content,
        action_payload: msg.actionPayload,
        created_at: msg.createdAt.toISOString(),
      }, { status: 201 });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (error: any) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: error.message || 'خطا در عملیات گفتگو' }, { status: 500 });
  }
}

// ویرایش عنوان یا تایید/رد اکشن پیام
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, conversationId, title, messageId, actionPayload } = body;
    const db = getScopedDb(user.id);

    if (type === 'RENAME_CONVERSATION' && conversationId && title) {
      const conv = await db.aiConversation.update({
        where: { id_userId: { id: conversationId, userId: user.id } },
        data: { title: title.trim() },
      });
      return NextResponse.json(conv);
    }

    if (type === 'UPDATE_ACTION_PAYLOAD' && messageId && actionPayload) {
      const msg = await db.aiMessage.update({
        where: { id: messageId },
        data: { actionPayload },
      });
      return NextResponse.json(msg);
    }

    return NextResponse.json({ error: 'پارامترها نامعتبر است' }, { status: 400 });
  } catch (error: any) {
    console.error('Conversations PATCH error:', error);
    return NextResponse.json({ error: 'خطا در به‌روزرسانی' }, { status: 500 });
  }
}

// حذف گفتگو
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'عدم دسترسی' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'شناسه گفتگو ارسال نشده است' }, { status: 400 });
    }

    const db = getScopedDb(user.id);
    await db.aiConversation.delete({
      where: { id_userId: { id, userId: user.id } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Conversations DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف گفتگو' }, { status: 500 });
  }
}