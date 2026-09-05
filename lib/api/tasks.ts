// lib/api/tasks.ts
import { Task } from '@/components/Dashboard';

export async function getTasks(): Promise<Task[] | null> {
  try {
    const res = await fetch('/api/tasks', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.map((t: any) => ({
      id: t.id,
      title: t.title,
      desc: t.description || '',
      priority: (t.priority || 'medium').toUpperCase(),
      status: t.status || 'todo',
      dueDate: t.dueDate || '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    }));
  } catch (err) {
    console.error('API getTasks failed:', err);
    return null;
  }
}

export async function addTask(task: Task): Promise<Task | null> {
  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: task.id,
        title: task.title,
        description: task.desc,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        subtasks: task.subtasks || [],
      }),
    });
    if (!res.ok) return null;
    const t = await res.json();
    return {
      id: t.id,
      title: t.title,
      desc: t.description || '',
      priority: (t.priority || 'medium').toUpperCase(),
      status: t.status || 'todo',
      dueDate: t.dueDate || '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    };
  } catch (err) {
    console.error('API addTask failed:', err);
    return null;
  }
}

// ارسال درخواست به PATCH با فیلدهای انتخابی بدون نیاز به title
export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  try {
    const payload: Record<string, any> = { id };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.desc !== undefined) payload.description = updates.desc;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
    if (updates.subtasks !== undefined) payload.subtasks = updates.subtasks;

    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) return null;
    const t = await res.json();
    return {
      id: t.id,
      title: t.title,
      desc: t.description || '',
      priority: (t.priority || 'medium').toUpperCase(),
      status: t.status || 'todo',
      dueDate: t.dueDate || '',
      subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    };
  } catch (err) {
    console.error('API updateTask failed:', err);
    return null;
  }
}

export async function deleteTask(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('API deleteTask failed:', err);
    return false;
  }
}