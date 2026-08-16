import { createClient, handleSupabaseError } from './client';
import { Task } from '../../components/Dashboard';

export async function getTasks() {
  const supabase = createClient();
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    handleSupabaseError('getTasks', error);
    return null;
  }
  // adapt DB schema to app interface
  return (data as any[]).map(t => ({
    id: t.id,
    title: t.title,
    desc: t.description || '',
    priority: t.priority?.toUpperCase() || 'MEDIUM',
    status: t.status || 'todo',
    dueDate: t.due_date || ''
  })) as Task[];
}

export async function addTask(task: Task) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const payload: any = {
    id: task.id,
    user_id: user.id,
    title: task.title,
    description: task.desc,
    priority: task.priority.toLowerCase(),
    status: task.status,
    due_date: task.dueDate || null,
  };
  const { data, error } = await supabase.from('tasks').upsert(payload).select().single();
  
  if (error) {
    console.error('Error adding task:', error);
    return null;
  }
  const resData = data as any;
  return {
    id: resData.id,
    title: resData.title,
    desc: resData.description || '',
    priority: resData.priority?.toUpperCase() || 'MEDIUM',
    status: resData.status,
    dueDate: resData.due_date || ''
  } as Task;
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUpdates: any = { id, user_id: user.id };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.desc !== undefined) dbUpdates.description = updates.desc;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority.toLowerCase();
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate || null;

  const { data, error } = await (supabase.from('tasks') as any).update(dbUpdates).eq('id', id).select().single();
  if (error) {
    console.error('Error updating task:', error);
    return null;
  }
  const resData = data as any;
  return {
    id: resData.id,
    title: resData.title,
    desc: resData.description || '',
    priority: resData.priority?.toUpperCase() || 'MEDIUM',
    status: resData.status,
    dueDate: resData.due_date || ''
  } as Task;
}

export async function deleteTask(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }
  return true;
}
