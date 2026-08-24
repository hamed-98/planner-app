import { createClient } from './client';

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
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await (supabase as any)
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getConversations error:', err);
    return [];
  }
}

export async function createConversation(title = 'گفتگوی جدید'): Promise<Conversation | null> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await (supabase as any)
      .from('ai_conversations')
      .insert({ user_id: user.id, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createConversation error:', err);
    return null;
  }
}

export async function deleteConversation(id: string): Promise<boolean> {
  const supabase = createClient();
  try {
    const { error } = await (supabase as any)
      .from('ai_conversations')
      .delete()
      .eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteConversation error:', err);
    return false;
  }
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  try {
    const { data, error } = await (supabase as any)
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('getConversationMessages error:', err);
    return [];
  }
}

export async function saveChatMessage(
  conversationId: string,
  sender: 'user' | 'assistant',
  content: string,
  actionPayload?: any
): Promise<ChatMessage | null> {
  const supabase = createClient();
  try {
    const { data, error } = await (supabase as any)
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        sender,
        content,
        action_payload: actionPayload || null
      })
      .select()
      .single();

    if (error) throw error;

    // به‌روزرسانی تاریخ گفتگوی مربوطه
    await (supabase as any)
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  } catch (err) {
    console.error('saveChatMessage error:', err);
    return null;
  }
}

export async function getAiUsageToday(): Promise<{ count: number; limit: number; plan: string }> {
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { count: 0, limit: 15, plan: 'free' };

    const todayStr = new Date().toISOString().split('T')[0];
    const { data: profile } = await (supabase.from('profiles') as any).select('plan').eq('id', user.id).maybeSingle();
    const plan = profile?.plan || 'free';
    const limit = plan === 'pro' ? 100 : plan === 'team' ? 250 : 15;

    const { data: usage } = await (supabase.from('user_ai_usage') as any)
      .select('request_count')
      .eq('user_id', user.id)
      .eq('usage_date', todayStr)
      .maybeSingle();

    return { count: usage?.request_count || 0, limit, plan };
  } catch {
    return { count: 0, limit: 15, plan: 'free' };
  }
}