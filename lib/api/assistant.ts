// lib/api/assistant.ts
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  action_payload?: any;
  created_at: string;
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await fetch('/api/assistant/conversations', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createConversation(title = 'گفتگوی جدید'): Promise<Conversation | null> {
  try {
    const res = await fetch('/api/assistant/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CREATE_CONVERSATION', title }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/assistant/conversations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const res = await fetch(`/api/assistant/conversations?conversationId=${encodeURIComponent(conversationId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveChatMessage(
  conversationId: string,
  sender: 'user' | 'assistant',
  content: string,
  actionPayload?: any
): Promise<ChatMessage | null> {
  try {
    const res = await fetch('/api/assistant/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SAVE_MESSAGE',
        conversationId,
        sender,
        content,
        actionPayload,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getAiUsageToday(): Promise<{ count: number; limit: number; plan: string }> {
  try {
    const res = await fetch('/api/assistant/usage', { cache: 'no-store' });
    if (!res.ok) return { count: 0, limit: 15, plan: 'free' };
    return await res.json();
  } catch {
    return { count: 0, limit: 15, plan: 'free' };
  }
}