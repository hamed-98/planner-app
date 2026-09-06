// lib/api/tickets.ts
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
  user_email?: string;
  user_name?: string;
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

export async function getTickets(isAdminMode: boolean = false): Promise<Ticket[]> {
  try {
    const res = await fetch('/api/tickets', { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createTicket(ticket: {
  title: string;
  description: string;
  category: 'bug' | 'suggestion' | 'question' | 'other';
  priority: 'low' | 'medium' | 'high';
}): Promise<Ticket | null> {
  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  try {
    const res = await fetch(`/api/tickets?ticketId=${encodeURIComponent(ticketId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function sendTicketMessage(ticketId: string, messageText: string, isAdmin: boolean = false): Promise<TicketMessage | null> {
  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SEND_MESSAGE', ticketId, messageText, isAdmin }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateTicketStatus(ticketId: string, status: Ticket['status']): Promise<Ticket | null> {
  try {
    const res = await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, status }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateTicketPriority(ticketId: string, priority: Ticket['priority']): Promise<Ticket | null> {
  try {
    const res = await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, priority }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}