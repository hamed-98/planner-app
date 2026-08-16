import { createClient, handleSupabaseError } from './client';
import { Note } from '../../components/Dashboard';

export async function getNotes() {
  const supabase = createClient();
  const { data, error } = await supabase.from('notes').select('*');
  if (error) {
    handleSupabaseError('getNotes', error);
    return null;
  }
  return (data as any[]).map(n => ({
    id: n.id,
    title: n.title || '',
    content: n.content || '',
    folder: n.folder || 'personal',
    tags: n.tags || [],
    isPinned: !!n.is_pinned,
    updatedAt: n.updated_at
  })) as Note[];
}

export async function addNote(note: Note) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const payload: any = {
    id: note.id,
    user_id: user.id,
    title: note.title,
    content: note.content,
    folder: note.folder,
    tags: note.tags,
    is_pinned: note.isPinned
  };
  const { data, error } = await supabase.from('notes').upsert(payload).select().single();

  if (error) {
    console.error('Error adding note:', error);
    return null;
  }
  const resData = data as any;
  return {
    id: resData.id,
    title: resData.title || '',
    content: resData.content || '',
    folder: resData.folder || 'personal',
    tags: resData.tags || [],
    isPinned: !!resData.is_pinned,
    updatedAt: resData.updated_at
  } as Note;
}

export async function updateNote(id: string, updates: Partial<Note>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUpdates: any = { id, user_id: user.id, updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.folder !== undefined) dbUpdates.folder = updates.folder;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;

  const { data, error } = await (supabase.from('notes') as any).update(dbUpdates).eq('id', id).select().single();
  if (error) {
    console.error('Error updating note:', error);
    return null;
  }
  const resData = data as any;
  return {
    id: resData.id,
    title: resData.title || '',
    content: resData.content || '',
    folder: resData.folder || 'personal',
    tags: resData.tags || [],
    isPinned: !!resData.is_pinned,
    updatedAt: resData.updated_at
  } as Note;
}

export async function deleteNote(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }
  return true;
}
