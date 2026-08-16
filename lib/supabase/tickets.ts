import { createClient, handleSupabaseError } from './client';

export interface Ticket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'bug' | 'suggestion' | 'question' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  user_email?: string; // Opt-in join or from auth
  user_name?: string;  // Profile full name
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_name?: string;
  sender_email?: string;
}

// Fetch all tickets for current user, or ALL tickets if user is admin (handles RLS nicely)
export async function getTickets(isAdminMode: boolean = false) {
  const supabase = createClient();
  
  if (isAdminMode) {
    // If admin mode, let's select tickets
    const { data: ticketsRaw, error: ticketsError } = await (supabase.from('tickets') as any)
      .select('*')
      .order('updated_at', { ascending: false });

    if (ticketsError) {
      handleSupabaseError('getTickets(admin)', ticketsError);
      if (ticketsError.code === 'PGRST200' || ticketsError.code === '42P01') {
        return null;
      }
      return [];
    }

    if (!ticketsRaw || ticketsRaw.length === 0) {
      return [];
    }

    const ticketsData = ticketsRaw as any[];

    // Fetch profiles for all distinct user_ids
    const userIds = Array.from(new Set(ticketsData.map(t => t.user_id)));
    const { data: profilesData } = await (supabase.from('profiles') as any)
      .select('id, full_name, email')
      .in('id', userIds);

    const profilesMap: Record<string, string> = {};
    if (profilesData) {
      (profilesData as any[]).forEach(p => {
        profilesMap[p.id] = p.full_name || p.email || 'کاربر بدون نام';
      });
    }
    
    return ticketsData.map(t => ({
      ...t,
      user_name: profilesMap[t.user_id] || 'کاربر بدون نام'
    })) as Ticket[];
  } else {
    // Regular user
    const { data, error } = await (supabase.from('tickets') as any)
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      handleSupabaseError('getTickets(user)', error);
      if (error.code === 'PGRST200' || error.code === '42P01') {
        return null;
      }
      return [];
    }
    
    return data as Ticket[];
  }
}

// Create a new ticket
export async function createTicket(ticket: {
  title: string;
  description: string;
  category: 'bug' | 'suggestion' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high';
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload = {
    user_id: user.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: 'open' as const
  };

  const { data, error } = await (supabase.from('tickets') as any)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
  
  // Also create initial ticket message or let the ticket itself act as the starter
  return data as Ticket;
}

// Get all messages for a specific ticket
export async function getTicketMessages(ticketId: string) {
  const supabase = createClient();
  
  const { data: messagesRaw, error: messagesError } = await (supabase.from('ticket_messages') as any)
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    handleSupabaseError('getTicketMessages', messagesError);
    return [];
  }

  if (!messagesRaw || messagesRaw.length === 0) {
    return [];
  }

  const messagesData = messagesRaw as any[];

  // Fetch profiles for sender_ids to avoid joining issue
  const senderIds = Array.from(new Set(messagesData.map(m => m.sender_id)));
  const { data: profilesData } = await (supabase.from('profiles') as any)
    .select('id, full_name')
    .in('id', senderIds);

  const profilesMap: Record<string, string> = {};
  if (profilesData) {
    (profilesData as any[]).forEach(p => {
      profilesMap[p.id] = p.full_name;
    });
  }

  return messagesData.map(m => ({
    id: m.id,
    ticket_id: m.ticket_id,
    sender_id: m.sender_id,
    message: m.message,
    is_admin: m.is_admin,
    created_at: m.created_at,
    sender_name: profilesMap[m.sender_id] || (m.is_admin ? 'پشتیبان سیستم' : 'کاربر')
  })) as TicketMessage[];
}

// Send message to a ticket
export async function sendTicketMessage(ticketId: string, messageText: string, isAdmin: boolean = false) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload = {
    ticket_id: ticketId,
    sender_id: user.id,
    message: messageText,
    is_admin: isAdmin
  };

  const { data, error } = await (supabase.from('ticket_messages') as any)
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error sending ticket message:', error);
    return null;
  }

  // Update ticket's updated_at timestamp
  await (supabase.from('tickets') as any)
    .update({ updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  return data as TicketMessage;
}

// Update ticket status (admin action)
export async function updateTicketStatus(ticketId: string, status: Ticket['status']) {
  const supabase = createClient();
  const { data, error } = await (supabase.from('tickets') as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket status:', error);
    return null;
  }

  return data as Ticket;
}

// Update ticket priority (admin action)
export async function updateTicketPriority(ticketId: string, priority: Ticket['priority']) {
  const supabase = createClient();
  const { data, error } = await (supabase.from('tickets') as any)
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket priority:', error);
    return null;
  }

  return data as Ticket;
}
