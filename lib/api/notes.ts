// lib/api/notes.ts
import { Note } from '@/components/Dashboard';

export async function getNotes(): Promise<Note[] | null> {
  try {
    const res = await fetch('/api/notes', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((n: any) => ({
      id: n.id,
      title: n.title || '',
      content: n.content || '',
      folder: n.folder || 'شخصی',
      tags: Array.isArray(n.tags) ? n.tags : [],
      isPinned: !!n.isPinned,
      updatedAt: n.updatedAt,
    })) as Note[];
  } catch (err) {
    console.error('API getNotes error:', err);
    return null;
  }
}

export async function addNote(note: Note): Promise<Note | null> {
  try {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: note.id,
        title: note.title,
        content: note.content,
        folder: note.folder,
        tags: note.tags,
        isPinned: note.isPinned,
      }),
    });
    if (!res.ok) return null;
    const n = await res.json();
    return {
      id: n.id,
      title: n.title || '',
      content: n.content || '',
      folder: n.folder || 'شخصی',
      tags: Array.isArray(n.tags) ? n.tags : [],
      isPinned: !!n.isPinned,
      updatedAt: n.updatedAt,
    };
  } catch (err) {
    console.error('API addNote error:', err);
    return null;
  }
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
  try {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) return null;
    const n = await res.json();
    return {
      id: n.id,
      title: n.title || '',
      content: n.content || '',
      folder: n.folder || 'شخصی',
      tags: Array.isArray(n.tags) ? n.tags : [],
      isPinned: !!n.isPinned,
      updatedAt: n.updatedAt,
    };
  } catch (err) {
    console.error('API updateNote error:', err);
    return null;
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('API deleteNote error:', err);
    return false;
  }
}