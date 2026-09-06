// lib/api/medicines.ts
import { Medicine } from '@/components/Dashboard';

export async function getMedicines(): Promise<Medicine[] | null> {
  try {
    const res = await fetch('/api/medicines', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API getMedicines error:', err);
    return null;
  }
}

export async function addMedicine(med: Medicine): Promise<Medicine | null> {
  try {
    const res = await fetch('/api/medicines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(med),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('API addMedicine error:', err);
    return null;
  }
}

export async function updateMedicineLog(id: string, completedDates: string[]) {
  try {
    await fetch('/api/medicines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completedDates }),
    });
  } catch (err) {
    console.error('API updateMedicineLog error:', err);
  }
}

export async function deleteMedicine(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/medicines?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('API deleteMedicine error:', err);
    return false;
  }
}